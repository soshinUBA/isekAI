from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _read_json(filename: str) -> Any:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing data file: {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_font_catalog() -> list[dict[str, Any]]:
    return _read_json("font_catalog.json")


@lru_cache(maxsize=1)
def load_font_metadata() -> list[dict[str, Any]]:
    return _read_json("font_metadata.json")


@lru_cache(maxsize=1)
def load_sample_customers() -> list[dict[str, Any]]:
    return _read_json("sample_customers.json")


@lru_cache(maxsize=1)
def load_user_activity() -> list[dict[str, Any]]:
    return _read_json("user_activity.json")


def get_activity_by_user_id(user_id: str) -> dict[str, Any] | None:
    for row in load_user_activity():
        if row.get("user_id") == user_id:
            return row
    return None


def get_font_by_slug(slug: str) -> dict[str, Any] | None:
    slug = slug.lower()
    for font in load_font_catalog():
        if font.get("slug") == slug:
            return font
    return None


def search_fonts(q: str = "", category: str | None = None, featured: bool | None = None) -> list[dict[str, Any]]:
    q = (q or "").strip().lower()
    results: list[dict[str, Any]] = []
    for font in load_font_catalog():
        if category and font.get("category", "").lower() != category.lower():
            continue
        if featured is not None and bool(font.get("featured")) != featured:
            continue
        haystack = " ".join(
            [
                font.get("name", ""),
                font.get("foundry", ""),
                font.get("category", ""),
                font.get("description", ""),
            ]
        ).lower()
        if q and q not in haystack:
            continue
        results.append(font)
    return results


def load_font_offers() -> list[dict[str, Any]]:
    path = DATA_DIR / "font_offers.json"
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_font_offers(offers: list[dict[str, Any]]) -> None:
    path = DATA_DIR / "font_offers.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(offers, f, indent=2)


def add_font_offer(offer: dict[str, Any]) -> list[dict[str, Any]]:
    offers = load_font_offers()
    offers = [o for o in offers if o["font_name"] != offer["font_name"]]
    offers.append(offer)
    save_font_offers(offers)
    return offers


def remove_font_offer(font_name: str) -> list[dict[str, Any]]:
    offers = load_font_offers()
    offers = [o for o in offers if o["font_name"] != font_name]
    save_font_offers(offers)
    return offers
