from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any

from services import data_loader
from services.ai_analyzer import analyze_activity
from services.email_draft import generate_email_draft
from services.intent_scoring import calculate_intent_score
from services.recommendation import recommend_fonts

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
QUEUE_FILE = DATA_DIR / "processed_queue.json"

HIGH_INTENT_THRESHOLD = 70
MAX_WORKERS = 5  # Number of parallel workers for processing


def _load_queue() -> list[dict[str, Any]]:
    if not QUEUE_FILE.exists():
        return []
    with QUEUE_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def _save_queue(queue: list[dict[str, Any]]) -> None:
    with QUEUE_FILE.open("w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, default=str)


def get_high_intent_queue() -> list[dict[str, Any]]:
    return _load_queue()


def get_queue_item(user_id: str) -> dict[str, Any] | None:
    for item in _load_queue():
        if item.get("user_id") == user_id:
            return item
    return None


def update_email_draft(user_id: str, subject: str, body: str) -> dict[str, Any] | None:
    queue = _load_queue()
    for item in queue:
        if item.get("user_id") == user_id:
            item["email_draft"]["subject"] = subject
            item["email_draft"]["body"] = body
            item["email_draft"]["last_edited"] = datetime.now().isoformat()
            _save_queue(queue)
            return item
    return None


def mark_as_sent(user_id: str) -> dict[str, Any] | None:
    queue = _load_queue()
    for item in queue:
        if item.get("user_id") == user_id:
            item["status"] = "sent"
            item["sent_at"] = datetime.now().isoformat()
            _save_queue(queue)
            return item
    return None


def _process_single_customer(
    activity: dict[str, Any],
    intent: dict[str, Any],
    fonts_metadata: list[dict[str, Any]],
) -> dict[str, Any]:
    """Process a single high-intent customer (AI analysis + email generation)."""
    ai_analysis = analyze_activity(activity)
    recs = recommend_fonts(activity, fonts_metadata, limit=5)
    recommended_fonts = [
        {"font_name": r["font_name"], "reason": r["reason"], "score": r.get("score")}
        for r in recs
    ]
    
    analysis_data = {
        "intent_summary": ai_analysis.get("intent_summary", ""),
        "buying_intent_score": intent["score"],
        "intent_level": intent["level"],
        "score_breakdown": intent["breakdown"],
        "possible_blockers": ai_analysis.get("possible_blockers", []),
        "recommended_fonts": recommended_fonts,
        "likely_use_case": ai_analysis.get("likely_use_case"),
        "buying_stage": ai_analysis.get("buying_stage"),
    }
    
    email_draft = generate_email_draft(
        activity,
        analysis_data,
        sales_rep_name="MyFonts Sales Team",
    )
    
    return {
        "user_id": activity.get("user_id"),
        "email": activity.get("email", ""),
        "company": activity.get("organization_name", ""),
        "processed_at": datetime.now().isoformat(),
        "intent_score": intent["score"],
        "intent_level": intent["level"],
        "analysis": analysis_data,
        "activity": activity,
        "email_draft": {
            "subject": email_draft.get("subject", ""),
            "body": email_draft.get("body", ""),
            "generated_at": datetime.now().isoformat(),
            "last_edited": None,
        },
        "status": "pending",
        "sent_at": None,
    }


def process_all_customers(max_workers: int = MAX_WORKERS) -> dict[str, Any]:
    """
    Process all customers with parallel execution:
    1. Load all customer activities
    2. Calculate intent score for each (fast, local)
    3. Filter high-intent customers (score >= 70)
    4. Run AI analysis + email generation in parallel
    5. Save to processed_queue.json
    """
    activities = data_loader.load_user_activity()
    fonts_metadata = data_loader.load_font_metadata()
    
    existing_queue = _load_queue()
    existing_ids = {item["user_id"]: item for item in existing_queue}
    
    processed_count = len(activities)
    
    # Step 1: Filter high-intent customers (fast, no LLM calls)
    high_intent_customers: list[tuple[dict[str, Any], dict[str, Any]]] = []
    already_sent: list[dict[str, Any]] = []
    
    for activity in activities:
        user_id = activity.get("user_id")
        if not user_id:
            continue
            
        intent = calculate_intent_score(activity)
        
        if intent["score"] < HIGH_INTENT_THRESHOLD:
            continue
        
        # Skip already-sent customers, preserve their data
        if user_id in existing_ids and existing_ids[user_id].get("status") == "sent":
            already_sent.append(existing_ids[user_id])
        else:
            high_intent_customers.append((activity, intent))
    
    high_intent_count = len(high_intent_customers) + len(already_sent)
    
    # Step 2: Process high-intent customers in parallel
    new_queue: list[dict[str, Any]] = list(already_sent)
    
    if high_intent_customers:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(
                    _process_single_customer, activity, intent, fonts_metadata
                ): activity["user_id"]
                for activity, intent in high_intent_customers
            }
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    new_queue.append(result)
                except Exception as e:
                    user_id = futures[future]
                    print(f"Error processing customer {user_id}: {e}")
    
    # Sort by intent score (highest first)
    new_queue.sort(key=lambda x: x.get("intent_score", 0), reverse=True)
    _save_queue(new_queue)
    
    return {
        "processed": processed_count,
        "high_intent": high_intent_count,
        "queue_size": len(new_queue),
    }
