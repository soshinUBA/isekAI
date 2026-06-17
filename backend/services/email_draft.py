from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()


def _mock_draft(first_name: str, analysis: dict[str, Any]) -> dict[str, str]:
    name = first_name or "there"
    fonts = analysis.get("recommended_fonts") or []
    font_hint = fonts[0].get("font_name") if fonts else "a few serif families"
    subject = f"Ideas for {font_hint} on your next project"
    body = (
        f"Hi {name},\n\n"
        "Thanks for spending time on MyFonts recently. Based on what you were exploring, "
        f"{font_hint} might be a strong fit for refined editorial or branding work.\n\n"
        "If helpful, I can share licensing options or specimen PDFs for your team review.\n\n"
        "Best,\nFonts Follow-up Team"
    )
    return {"subject": subject, "body": body}


def generate_email_draft(
    activity: dict[str, Any],
    analysis: dict[str, Any],
    sales_rep_name: str = "Sales Team",
    first_name: str | None = None,
) -> dict[str, str]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("OPENAI_API_VERSION", "2024-10-21")

    first = first_name or (activity.get("email") or "").split("@")[0].split(".")[0].title() or "there"
    if not api_key or not endpoint or not deployment:
        draft = _mock_draft(first, analysis)
        draft["disclaimer"] = "Draft for human review only. Do not send automatically."
        return draft

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        prompt = (
            "Write a short, friendly follow-up email for a font customer. Return JSON with subject and body. "
            "Do not sound creepy. Sign as " + sales_rep_name + ".\n\n"
            "Activity:\n" + json.dumps(activity, indent=2) + "\n\nAnalysis:\n" + json.dumps(analysis, indent=2)
        )
        resp = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        return {
            "subject": data.get("subject", _mock_draft(first, analysis)["subject"]),
            "body": data.get("body", _mock_draft(first, analysis)["body"]),
            "disclaimer": "Draft for human review only. Do not send automatically.",
        }
    except Exception:
        draft = _mock_draft(first, analysis)
        draft["disclaimer"] = "Draft for human review only. Do not send automatically."
        return draft
