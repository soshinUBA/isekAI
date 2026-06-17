from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    CustomerAnalysisResponse,
    EmailDraftRequest,
    EmailDraftResponse,
    FontCatalogItem,
    HealthResponse,
)
from services import data_loader
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
