from __future__ import annotations

from typing import Any


def calculate_intent_score(activity: dict[str, Any]) -> dict[str, Any]:
    """
    Buying intent scoring with tiered weights.
    
    TIER 1 - Strongest Buying Signals (25-35 pts)
    TIER 2 - Strong Interest (15-20 pts)
    TIER 3 - Engagement (5-10 pts)
    NEGATIVE - Red flags that reduce score
    """
    score = 0
    breakdown: list[dict[str, int | str]] = []

    def add(signal: str, points: int) -> None:
        nonlocal score
        score += points
        breakdown.append({"signal": signal, "points": points})

    # --- TIER 1: Strongest Buying Signals (25-35 pts) ---
    
    if len(activity.get("cart_additions", [])) > 0:
        add("Added to cart", 35)

    license_visits = activity.get("license_page_visits", 0)
    if license_visits >= 2:
        add("Viewed licensing/pricing multiple times", 25)
    elif license_visits == 1:
        add("Viewed licensing/pricing", 20)

    if len(activity.get("trial_downloads", [])) > 0:
        add("Downloaded trial font", 25)

    # --- TIER 2: Strong Interest (15-20 pts) ---
    
    viewed_fonts = activity.get("font_pages_viewed", [])
    if len(viewed_fonts) != len(set(viewed_fonts)):
        add("Returned to same font family", 20)

    if len(activity.get("fonts_compared", [])) >= 2:
        add("Compared 2+ fonts", 15)

    if len(activity.get("past_purchases", [])) > 0:
        add("Existing customer", 15)

    if activity.get("repeated_visit_days", 0) >= 2:
        add("Visited over multiple days", 15)

    # --- TIER 3: Engagement Signals (5-10 pts) ---
    
    if activity.get("time_spent_minutes", 0) >= 15:
        add("Spent 15+ minutes researching", 10)

    if activity.get("visit_count", 0) >= 3:
        add("Returned 3+ times", 10)

    if len(viewed_fonts) >= 5:
        add("Viewed 5+ fonts", 10)

    # --- NEGATIVE SIGNALS ---
    
    search_queries = activity.get("search_queries", [])
    has_free_search = any("free" in q.lower() for q in search_queries)
    if has_free_search:
        add("Searched for 'free' fonts", -15)

    if len(activity.get("cart_removals", [])) > 0:
        add("Removed items from cart", -10)

    if len(activity.get("trial_downloads", [])) > 0 and activity.get("visit_count", 0) == 1:
        add("Downloaded trial but never returned", -10)

    time_spent = activity.get("time_spent_minutes", 0)
    if time_spent < 2 and len(viewed_fonts) > 5:
        add("Bounced quickly from many pages", -10)

    # --- Calculate final score and level ---
    
    score = max(0, min(score, 100))

    if score <= 30:
        level = "Low"
    elif score <= 60:
        level = "Medium"
    elif score <= 80:
        level = "High"
    else:
        level = "Very High"

    return {"score": score, "level": level, "breakdown": breakdown}
