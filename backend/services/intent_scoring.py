from __future__ import annotations

from typing import Any


def calculate_intent_score(activity: dict[str, Any]) -> dict[str, Any]:
    """
    Buying intent scoring using weighted average percentages.
    
    Each tier contributes a maximum percentage to the final score:
    - TIER 1 (Strongest Buying Signals): 50% max
    - TIER 2 (Strong Interest): 30% max
    - TIER 3 (Engagement): 20% max
    - NEGATIVE signals subtract from the total
    
    A user needs signals across ALL tiers to approach 100%.
    """
    breakdown: list[dict[str, Any]] = []
    
    # Tier weights (max contribution percentages)
    TIER1_WEIGHT = 50
    TIER2_WEIGHT = 30
    TIER3_WEIGHT = 20
    
    # --- TIER 1: Strongest Buying Signals (50% max) ---
    tier1_signals: list[str] = []
    tier1_total = 3  # Total possible signals in tier
    
    if len(activity.get("cart_additions", [])) > 0:
        tier1_signals.append("Added to cart")
    
    license_visits = activity.get("license_page_visits", 0)
    if license_visits >= 1:
        tier1_signals.append("Viewed licensing/pricing")
    
    if len(activity.get("trial_downloads", [])) > 0:
        tier1_signals.append("Downloaded trial font")
    
    tier1_score = (len(tier1_signals) / tier1_total) * TIER1_WEIGHT
    if tier1_signals:
        breakdown.append({
            "tier": "Tier 1 (Strongest)",
            "signals": tier1_signals,
            "contribution": round(tier1_score, 1)
        })
    
    # --- TIER 2: Strong Interest (30% max) ---
    tier2_signals: list[str] = []
    tier2_total = 4  # Total possible signals in tier
    
    viewed_fonts = activity.get("font_pages_viewed", [])
    if len(viewed_fonts) != len(set(viewed_fonts)):
        tier2_signals.append("Returned to same font family")
    
    if len(activity.get("fonts_compared", [])) >= 2:
        tier2_signals.append("Compared 2+ fonts")
    
    if len(activity.get("past_purchases", [])) > 0:
        tier2_signals.append("Existing customer")
    
    if activity.get("repeated_visit_days", 0) >= 2:
        tier2_signals.append("Visited over multiple days")
    
    tier2_score = (len(tier2_signals) / tier2_total) * TIER2_WEIGHT
    if tier2_signals:
        breakdown.append({
            "tier": "Tier 2 (Strong Interest)",
            "signals": tier2_signals,
            "contribution": round(tier2_score, 1)
        })
    
    # --- TIER 3: Engagement Signals (20% max) ---
    tier3_signals: list[str] = []
    tier3_total = 3  # Total possible signals in tier
    
    if activity.get("time_spent_minutes", 0) >= 15:
        tier3_signals.append("Spent 15+ minutes researching")
    
    if activity.get("visit_count", 0) >= 3:
        tier3_signals.append("Returned 3+ times")
    
    if len(viewed_fonts) >= 5:
        tier3_signals.append("Viewed 5+ fonts")
    
    tier3_score = (len(tier3_signals) / tier3_total) * TIER3_WEIGHT
    if tier3_signals:
        breakdown.append({
            "tier": "Tier 3 (Engagement)",
            "signals": tier3_signals,
            "contribution": round(tier3_score, 1)
        })
    
    # --- NEGATIVE SIGNALS (subtract percentages) ---
    negative_signals: list[dict[str, Any]] = []
    negative_penalty = 0
    
    search_queries = activity.get("search_queries", [])
    has_free_search = any("free" in q.lower() for q in search_queries)
    if has_free_search:
        negative_signals.append({"signal": "Searched for 'free' fonts", "penalty": 5})
        negative_penalty += 5
    
    if len(activity.get("cart_removals", [])) > 0:
        negative_signals.append({"signal": "Removed items from cart", "penalty": 4})
        negative_penalty += 4
    
    if len(activity.get("trial_downloads", [])) > 0 and activity.get("visit_count", 0) == 1:
        negative_signals.append({"signal": "Downloaded trial but never returned", "penalty": 4})
        negative_penalty += 4
    
    time_spent = activity.get("time_spent_minutes", 0)
    if time_spent < 2 and len(viewed_fonts) > 5:
        negative_signals.append({"signal": "Bounced quickly from many pages", "penalty": 4})
        negative_penalty += 4
    
    if negative_signals:
        breakdown.append({
            "tier": "Negative Signals",
            "signals": [s["signal"] for s in negative_signals],
            "contribution": -round(negative_penalty, 1)
        })
    
    # --- Calculate final score and level ---
    raw_score = tier1_score + tier2_score + tier3_score - negative_penalty
    score = round(max(0, min(raw_score, 100)))
    
    if score <= 25:
        level = "Low"
    elif score <= 50:
        level = "Medium"
    elif score <= 75:
        level = "High"
    else:
        level = "Very High"
    
    return {"score": score, "level": level, "breakdown": breakdown}
