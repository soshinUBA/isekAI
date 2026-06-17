#!/usr/bin/env python3
"""Polite MyFonts catalog scrape with local seed fallback."""

from __future__ import annotations

import json
import time
from pathlib import Path

import httpx

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CATALOG_PATH = DATA_DIR / "font_catalog.json"
SEED_PATH = DATA_DIR / "font_catalog.seed.json"
USER_AGENT = "FontsFollowupAgent/0.1 (+local-dev; respectful scrape)"


def load_seed() -> list[dict]:
    if SEED_PATH.exists():
        return json.loads(SEED_PATH.read_text(encoding="utf-8"))
    if CATALOG_PATH.exists():
        return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return []


def scrape_catalog(slugs: list[str] | None = None) -> list[dict]:
    seed = load_seed()
    slugs = slugs or [f.get("slug") for f in seed if f.get("slug")]
    results: list[dict] = []
    headers = {"User-Agent": USER_AGENT}

    with httpx.Client(timeout=20.0, headers=headers, follow_redirects=True) as client:
        for slug in slugs:
            url = f"https://www.myfonts.com/products/{slug}/"
            try:
                resp = client.get(url)
                if resp.status_code != 200:
                    raise RuntimeError(f"HTTP {resp.status_code}")
                # MVP: keep structured seed row; live HTML parsing is out of scope.
                row = next((f for f in seed if f.get("slug") == slug), {"slug": slug, "name": slug})
                results.append(row)
            except Exception:
                row = next((f for f in seed if f.get("slug") == slug), None)
                if row:
                    results.append(row)
            time.sleep(1.2)

    if not results:
        results = seed
    CATALOG_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return results


if __name__ == "__main__":
    fonts = scrape_catalog()
    print(f"Wrote {len(fonts)} fonts to {CATALOG_PATH}")
