from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()


def _mock_draft(
    first_name: str,
    analysis: dict[str, Any],
    offers: list[dict[str, Any]] | None = None,
    new_arrivals: list[dict[str, Any]] | None = None,
) -> dict[str, str]:
    name = first_name or "there"
    fonts = analysis.get("recommended_fonts") or []
    font_hint = fonts[0].get("font_name") if fonts else "a few serif families"
    
    subject = f"Ideas for {font_hint} + exclusive offers for you"
    
    body_parts = [
        f"Hi {name},\n",
        "Thanks for spending time on MyFonts recently. Based on what you were exploring, "
        f"{font_hint} might be a strong fit for refined editorial or branding work.\n",
    ]
    
    if offers:
        body_parts.append("\n--- SPECIAL OFFERS ---\n")
        for offer in offers[:2]:
            body_parts.append(
                f"- {offer['font_name']}: {offer['discount_percent']}% OFF "
                f"(${offer['offer_price']:.2f} instead of ${offer['original_price']:.2f}) "
                f"- {offer['offer_label']}\n"
            )
    
    if new_arrivals:
        body_parts.append("\n--- NEW ARRIVALS FOR YOU ---\n")
        for arr in new_arrivals[:2]:
            body_parts.append(
                f"- {arr['font_name']}: {arr.get('reason', 'Matches your style preferences')}\n"
            )
    
    body_parts.append(
        "\nIf helpful, I can share licensing options or specimen PDFs for your team review.\n\n"
        "Best,\nFonts Follow-up Team"
    )
    
    return {"subject": subject, "body": "".join(body_parts)}


def generate_email_draft(
    activity: dict[str, Any],
    analysis: dict[str, Any],
    sales_rep_name: str = "Sales Team",
    first_name: str | None = None,
    offers: list[dict[str, Any]] | None = None,
    new_arrival_recommendations: list[dict[str, Any]] | None = None,
) -> dict[str, str]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("OPENAI_API_VERSION", "2024-10-21")

    first = first_name or (activity.get("email") or "").split("@")[0].split(".")[0].title() or "there"
    if not api_key or not endpoint or not deployment:
        draft = _mock_draft(first, analysis, offers, new_arrival_recommendations)
        draft["disclaimer"] = "Draft for human review only. Do not send automatically."
        return draft

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        
        prompt_parts = [
            "Write a short, friendly follow-up email for a font customer. Return JSON with subject and body. ",
            "Do not sound creepy. Sign as " + sales_rep_name + ".\n\n",
            "Activity:\n" + json.dumps(activity, indent=2) + "\n\n",
            "Analysis:\n" + json.dumps(analysis, indent=2) + "\n\n",
        ]
        
        if offers:
            prompt_parts.append(
                "IMPORTANT: Include these special offers naturally in the email (highlight savings):\n"
                + json.dumps(offers, indent=2) + "\n\n"
            )
        
        if new_arrival_recommendations:
            prompt_parts.append(
                "IMPORTANT: Mention these new arrival fonts that match the customer's taste:\n"
                + json.dumps(new_arrival_recommendations, indent=2) + "\n\n"
            )
        
        prompt_parts.append(
            "Make the email personal and helpful. If there are offers or new arrivals, "
            "weave them naturally into the message as added value, not a hard sell."
        )
        
        prompt = "".join(prompt_parts)
        
        resp = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        fallback = _mock_draft(first, analysis, offers, new_arrival_recommendations)
        return {
            "subject": data.get("subject", fallback["subject"]),
            "body": data.get("body", fallback["body"]),
            "disclaimer": "Draft for human review only. Do not send automatically.",
        }
    except Exception:
        draft = _mock_draft(first, analysis, offers, new_arrival_recommendations)
        draft["disclaimer"] = "Draft for human review only. Do not send automatically."
        return draft
