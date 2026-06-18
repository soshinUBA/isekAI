from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

MOCK_RECOMMENDATIONS = [
    {
        "font_name": "Vanguard Neo",
        "match_score": 85,
        "reason": "Based on their interest in modern sans-serif fonts for tech branding.",
    },
    {
        "font_name": "Sakura Sans",
        "match_score": 72,
        "reason": "Their focus on UI/UX projects aligns with this friendly, readable font.",
    },
]


def recommend_new_arrivals(
    activity: dict[str, Any],
    new_arrivals: list[dict[str, Any]],
    limit: int = 3,
) -> list[dict[str, Any]]:
    """
    Use AI to recommend new arrival fonts to a customer based on their activity.
    Returns a list of recommended fonts with match scores and reasons.
    """
    if not new_arrivals:
        return []

    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("OPENAI_API_VERSION", "2024-10-21")

    if not api_key or not endpoint or not deployment:
        return _mock_recommendations(new_arrivals, limit)

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )

        new_arrivals_summary = [
            {
                "font_name": f["font_name"],
                "category": f.get("category", ""),
                "mood_tags": f.get("mood_tags", []),
                "use_cases": f.get("use_cases", []),
                "description": f.get("description", ""),
            }
            for f in new_arrivals
        ]

        prompt = f"""You are an assistant helping a font sales team recommend newly released fonts to customers.

Analyze the customer's activity data and match them with the most suitable new arrival fonts.

Customer Activity:
{json.dumps(activity, indent=2)}

New Arrival Fonts:
{json.dumps(new_arrivals_summary, indent=2)}

Return a JSON object with a "recommendations" array containing up to {limit} fonts. Each recommendation should have:
- "font_name": exact name from the new arrivals list
- "match_score": 1-100 score indicating how well this font matches the customer's interests
- "reason": a brief, friendly explanation of why this font is recommended for them

Only recommend fonts that genuinely match the customer's interests based on their browsing history, preferences, and likely use cases. If fewer than {limit} fonts are good matches, return fewer.

Return JSON only."""

        resp = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        data = json.loads(text)
        recommendations = data.get("recommendations", [])

        valid_font_names = {f["font_name"] for f in new_arrivals}
        validated = []
        for rec in recommendations[:limit]:
            if rec.get("font_name") in valid_font_names:
                validated.append({
                    "font_name": rec["font_name"],
                    "match_score": min(100, max(1, int(rec.get("match_score", 50)))),
                    "reason": rec.get("reason", "Recommended based on your browsing history."),
                })
        return validated

    except Exception:
        return _mock_recommendations(new_arrivals, limit)


def _mock_recommendations(
    new_arrivals: list[dict[str, Any]],
    limit: int,
) -> list[dict[str, Any]]:
    """Return mock recommendations when AI is unavailable."""
    mock_reasons = [
        "Matches your interest in modern typography.",
        "Aligns with your browsing history and style preferences.",
        "Great fit for the type of projects you've been exploring.",
    ]
    result = []
    for i, font in enumerate(new_arrivals[:limit]):
        result.append({
            "font_name": font["font_name"],
            "match_score": 85 - (i * 8),
            "reason": mock_reasons[i % len(mock_reasons)],
        })
    return result
