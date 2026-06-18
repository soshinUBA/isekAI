from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    BatchProcessResponse,
    CustomerAnalysisResponse,
    EmailDraftRequest,
    EmailDraftResponse,
    FontCatalogItem,
    FontOffer,
    HealthResponse,
    QueueItem,
    UpdateDraftRequest,
)
from services import batch_processor, data_loader
from services.ai_analyzer import analyze_activity
from services.email_draft import generate_email_draft
from services.intent_scoring import calculate_intent_score
from services.recommendation import recommend_fonts

load_dotenv()

app = FastAPI(title="Fonts Follow-up Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _metadata_fonts() -> list[dict[str, Any]]:
    return data_loader.load_font_metadata()


AI_THRESHOLD_SCORE = 40


def _build_analysis(user_id: str) -> CustomerAnalysisResponse:
    activity = data_loader.get_activity_by_user_id(user_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Customer activity not found")

    intent = calculate_intent_score(activity)
    
    # Only run AI analysis for customers with intent score >= threshold
    if intent["score"] >= AI_THRESHOLD_SCORE:
        ai = analyze_activity(activity)
        ai_enriched = True
    else:
        # Skip AI for low-intent customers - use minimal fallback
        ai = {
            "intent_summary": "Low buying intent detected. Consider nurturing before direct outreach.",
            "likely_use_case": None,
            "buying_stage": "Browsing",
            "possible_blockers": [],
        }
        ai_enriched = False

    recs = recommend_fonts(activity, _metadata_fonts(), limit=5)
    recommended_fonts = [{"font_name": r["font_name"], "reason": r["reason"], "score": r.get("score")} for r in recs]

    blockers = list(ai.get("possible_blockers") or [])
    if not blockers:
        blockers = ["They may still be comparing options or reviewing licensing."]

    # Adjust recommended action based on intent level
    if intent["score"] >= 80:
        action = "High priority: Sales team should reach out with personalized follow-up."
    elif intent["score"] >= AI_THRESHOLD_SCORE:
        action = "Sales team should review and send a helpful follow-up email."
    else:
        action = "Low priority: Add to nurture campaign or wait for more engagement signals."

    return CustomerAnalysisResponse(
        user_id=user_id,
        intent_summary=ai.get("intent_summary", ""),
        buying_intent_score=intent["score"],
        intent_level=intent["level"],
        score_breakdown=intent["breakdown"],
        possible_blockers=blockers,
        recommended_fonts=recommended_fonts,
        recommended_action=action,
        likely_use_case=ai.get("likely_use_case"),
        buying_stage=ai.get("buying_stage"),
        ai_enriched=ai_enriched,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/fonts", response_model=list[FontCatalogItem])
def list_fonts() -> list[dict[str, Any]]:
    return data_loader.load_font_catalog()


@app.get("/fonts/search", response_model=list[FontCatalogItem])
def search_fonts(q: str = "", category: str | None = None, featured: bool | None = None):
    return data_loader.search_fonts(q=q, category=category, featured=featured)


@app.get("/fonts/{slug}")
def get_font(slug: str) -> dict[str, Any]:
    font = data_loader.get_font_by_slug(slug)
    if not font:
        raise HTTPException(status_code=404, detail="Font not found")
    meta = next((m for m in _metadata_fonts() if m.get("slug") == slug or m.get("font_name") == font.get("name")), None)
    return {"font": font, "metadata": meta}


@app.get("/customers")
def list_customers() -> list[dict[str, Any]]:
    return data_loader.load_sample_customers()


@app.get("/customer/{user_id}/activity")
def customer_activity(user_id: str) -> dict[str, Any]:
    activity = data_loader.get_activity_by_user_id(user_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Customer activity not found")
    return activity


@app.get("/customer/{user_id}/analysis", response_model=CustomerAnalysisResponse)
def customer_analysis(user_id: str) -> CustomerAnalysisResponse:
    return _build_analysis(user_id)


@app.post("/customer/{user_id}/generate-email", response_model=EmailDraftResponse)
def generate_email(user_id: str, body: EmailDraftRequest | None = None) -> EmailDraftResponse:
    body = body or EmailDraftRequest()
    activity = data_loader.get_activity_by_user_id(user_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Customer activity not found")
    analysis = _build_analysis(user_id).model_dump()
    draft = generate_email_draft(
        activity,
        analysis,
        sales_rep_name=body.sales_rep_name,
        first_name=body.first_name,
    )
    return EmailDraftResponse(**draft)


@app.post("/batch/process", response_model=BatchProcessResponse)
def run_batch_process() -> BatchProcessResponse:
    """Trigger batch processing of all customers. Filters high-intent and generates emails."""
    result = batch_processor.process_all_customers()
    return BatchProcessResponse(**result)


@app.get("/queue/high-intent", response_model=list[QueueItem])
def get_high_intent_queue() -> list[dict[str, Any]]:
    """Get all high-intent customers with pre-generated emails."""
    return batch_processor.get_high_intent_queue()


@app.get("/queue/new-arrival-recommendations")
def get_new_arrival_recommendations() -> list[dict[str, Any]]:
    """Get all customers with their AI-matched new arrival font recommendations."""
    queue = batch_processor.get_high_intent_queue()
    new_arrivals = data_loader.load_new_arrivals()
    new_arrivals_map = {f["font_name"]: f for f in new_arrivals}
    
    results = []
    for customer in queue:
        recs = customer.get("new_arrival_recommendations", [])
        if recs:
            enriched_recs = []
            for rec in recs:
                font_info = new_arrivals_map.get(rec["font_name"], {})
                enriched_recs.append({
                    **rec,
                    "category": font_info.get("category", ""),
                    "description": font_info.get("description", ""),
                    "price": font_info.get("price"),
                    "release_date": font_info.get("release_date", ""),
                })
            results.append({
                "user_id": customer["user_id"],
                "email": customer["email"],
                "company": customer.get("company", ""),
                "intent_score": customer["intent_score"],
                "intent_level": customer["intent_level"],
                "new_arrival_recommendations": enriched_recs,
            })
    
    return sorted(results, key=lambda x: x["intent_score"], reverse=True)


@app.get("/new-arrivals")
def get_new_arrivals() -> list[dict[str, Any]]:
    """Get all new arrival fonts."""
    return data_loader.load_new_arrivals()


@app.put("/queue/{user_id}/update-draft", response_model=QueueItem)
def update_draft(user_id: str, body: UpdateDraftRequest) -> dict[str, Any]:
    """Update/edit the email draft for a customer in the queue."""
    item = batch_processor.update_email_draft(user_id, body.subject, body.body)
    if not item:
        raise HTTPException(status_code=404, detail="Customer not found in queue")
    return item


@app.post("/queue/{user_id}/send", response_model=QueueItem)
def send_email(user_id: str) -> dict[str, Any]:
    """Mark email as sent (mock - does not actually send)."""
    item = batch_processor.mark_as_sent(user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Customer not found in queue")
    return item


@app.get("/offers")
def get_offers() -> list[dict[str, Any]]:
    """Get all font offers."""
    return data_loader.load_font_offers()


@app.get("/offers/with-customers")
def get_offers_with_matched_customers() -> list[dict[str, Any]]:
    """Get all offers with dynamically matched customers who have these fonts recommended."""
    offers = data_loader.load_font_offers()
    queue = batch_processor.get_high_intent_queue()
    
    results = []
    for offer in offers:
        font_name = offer["font_name"]
        matched = []
        for customer in queue:
            rec_fonts = customer.get("analysis", {}).get("recommended_fonts", [])
            for rec in rec_fonts:
                if rec.get("font_name") == font_name:
                    matched.append({
                        "user_id": customer["user_id"],
                        "email": customer["email"],
                        "company": customer.get("company"),
                        "intent_score": customer["intent_score"],
                        "intent_level": customer["intent_level"],
                        "match_reason": rec.get("reason", ""),
                        "match_score": rec.get("score", 0),
                    })
                    break
        
        results.append({
            "offer": offer,
            "matched_customers": sorted(matched, key=lambda x: x["intent_score"], reverse=True),
        })
    
    return results


@app.post("/offers", response_model=FontOffer)
def add_offer(offer: FontOffer) -> dict[str, Any]:
    """Add or update a font offer."""
    data_loader.add_font_offer(offer.model_dump())
    return offer.model_dump()


@app.delete("/offers/{font_name}")
def remove_offer(font_name: str) -> dict[str, str]:
    """Remove a font offer."""
    data_loader.remove_font_offer(font_name)
    return {"status": "removed", "font_name": font_name}
