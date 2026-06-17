from __future__ import annotations

from typing import Any


def recommend_fonts(activity: dict[str, Any], fonts: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    search_text = " ".join(activity.get("search_queries", [])).lower()
    filters = [f.lower() for f in activity.get("filters_used", [])]
    viewed = set(activity.get("font_pages_viewed", []))
    purchased = set(activity.get("past_purchases", []))
    results: list[dict[str, Any]] = []

    license_visits = activity.get("license_page_visits", 0)

    for font in fonts:
        font_name = font["font_name"]
        if font_name in purchased:
            continue

        score = 0
        reasons: list[str] = []
        category = font.get("category", "").lower()
        mood_tags = [m.lower() for m in font.get("mood_tags", [])]
        use_cases = [u.lower() for u in font.get("use_cases", [])]
        visual_attributes = [v.lower() for v in font.get("visual_attributes", [])]
        language_support = [lang.lower() for lang in font.get("language_support", [])]
        licensing_fit = [lic.lower() for lic in font.get("licensing_fit", [])]

        if category in search_text or category in filters:
            score += 20
            reasons.append(f"Matches the {category} category")

        for tag in mood_tags:
            if tag in search_text:
                score += 15
                reasons.append(f"Matches the '{tag}' style interest")

        for use_case in use_cases:
            if use_case in search_text:
                score += 15
                reasons.append(f"Fits the {use_case} use case")

        for attr in visual_attributes:
            if attr in search_text:
                score += 10
                reasons.append(f"Has {attr} visual qualities")

        for lang in language_support:
            if lang in filters:
                score += 10
                reasons.append(f"Supports {lang}")

        if font.get("weights_count", 0) >= 6:
            score += 10
            reasons.append("Has a complete family with multiple weights")

        if license_visits > 0 and licensing_fit:
            score += 5
            reasons.append("Licensing options align with pricing research")

        if font_name in viewed:
            score += 5
            reasons.append("User has already shown interest in this font")

        if score > 0:
            results.append({
                "font_name": font_name,
                "score": score,
                "reason": "; ".join(reasons[:3]),
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]
