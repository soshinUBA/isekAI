from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

MOCK_ANALYSIS = {
    "intent_summary": "The customer appears to be exploring display serif options for editorial or luxury branding.",
    "likely_use_case": "Editorial or luxury branding",
    "buying_stage": "Evaluation",
    "possible_blockers": [
        "They may still be comparing similar serif families.",
        "They may need clarity on licensing or weights.",
    ],
}


def analyze_activity(activity: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("OPENAI_API_VERSION", "2024-10-21")

    if not api_key or not endpoint or not deployment:
        return dict(MOCK_ANALYSIS)

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        prompt = (
            "You are an assistant helping a font sales team. Analyze customer activity and return JSON only with keys: "
            "intent_summary, likely_use_case, buying_stage, possible_blockers as a JSON array. "
            "Do not use creepy language. Keep it sales-friendly.\n\nCustomer activity:\n"
            + json.dumps(activity, indent=2)
        )
        resp = client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        data = json.loads(text)
        return {
            "intent_summary": data.get("intent_summary", MOCK_ANALYSIS["intent_summary"]),
            "likely_use_case": data.get("likely_use_case", ""),
            "buying_stage": data.get("buying_stage", ""),
            "possible_blockers": data.get("possible_blockers") or [],
        }
    except Exception:
        return dict(MOCK_ANALYSIS)
