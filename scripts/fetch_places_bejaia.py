"""
Fetch DJS / Yed fel yed youth facilities for Wilaya de Béjaïa via Google Places API.

Usage:
  1. pip install googlemaps
  2. set GOOGLE_MAPS_API_KEY=your_key   (or pass --api-key)
  3. python scripts/fetch_places_bejaia.py

Output:
  public/geo/places-bejaia.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import googlemaps
except ImportError:
    print("Install dependency: pip install googlemaps", file=sys.stderr)
    sys.exit(1)

# Béjaïa (wilaya 06)
BEJAIA_CENTER = {"lat": 36.7525, "lng": 5.0833}
BEJAIA_RADIUS_M = 55_000  # ~55 km covers most of the wilaya coast + inland
WILAYA_CODE = 6

QUERIES = [
    "Maison de jeunes Béjaïa",
    "دار الشباب بجاية",
    "بيت الشباب بجاية",
    "Auberge de jeunesse Béjaïa",
    "Auberge de jeunes Béjaïa",
    "Centre culturel jeunesse Béjaïa",
    "Direction de la Jeunesse et des Sports Béjaïa",
    "DJS Béjaïa",
    "Yed fel yed Béjaïa",
    "Foyer de jeunes Béjaïa",
    "Camp de jeunes Béjaïa",
]


def infer_kind(name: str) -> str:
    n = (name or "").lower()
    if "auberge" in n or "نزل" in n:
        return "auberge"
    if "foyer" in n or "دار الشباب" in n:
        return "foyer"
    if "culturel" in n or "ثقاف" in n:
        return "centre_culturel"
    if "camp" in n or "مخيم" in n:
        return "camp"
    if "terrain" in n or "ملعب" in n or "complexe" in n or "مركب" in n:
        return "terrain"
    if "maison" in n or "بيت" in n or "jeune" in n or "شباب" in n:
        return "maison_jeunes"
    return "autre"


def infer_authority(name: str) -> str:
    n = (name or "").upper()
    if "DJS" in n or "DIRECTION" in n:
        return "DJS"
    return "Yed fel yed"


def fetch_places(api_key: str) -> list[dict]:
    gmaps = googlemaps.Client(key=api_key)
    all_results: list[dict] = []

    for query in QUERIES:
        print(f"Recherche : {query}")
        response = gmaps.places(
            query=query,
            location=BEJAIA_CENTER,
            radius=BEJAIA_RADIUS_M,
            language="fr",
            region="dz",
        )
        all_results.extend(response.get("results", []))

        while response.get("next_page_token"):
            time.sleep(2)
            response = gmaps.places(
                query=query,
                page_token=response["next_page_token"],
                language="fr",
                region="dz",
            )
            all_results.extend(response.get("results", []))

    return all_results


def to_app_places(raw: list[dict]) -> list[dict]:
    unique = {p["place_id"]: p for p in raw if p.get("place_id")}
    places = []
    for place_id, details in unique.items():
        loc = (details.get("geometry") or {}).get("location") or {}
        lat, lng = loc.get("lat"), loc.get("lng")
        if lat is None or lng is None:
            continue
        name = details.get("name") or "Établissement"
        places.append(
            {
                "id": f"gmaps-{place_id}",
                "placeId": place_id,
                "name": name,
                "address": details.get("formatted_address") or details.get("vicinity") or "",
                "lat": lat,
                "lng": lng,
                "rating": details.get("rating"),
                "types": details.get("types") or [],
                "wilayaCode": WILAYA_CODE,
                "structureKind": infer_kind(name),
                "authority": infer_authority(name),
                "source": "google_places",
            }
        )
    places.sort(key=lambda p: (p["structureKind"], p["name"]))
    return places


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch Yed fel yed/DJS places for Béjaïa")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOOGLE_MAPS_API_KEY") or os.environ.get("VITE_GOOGLE_MAPS_API_KEY"),
        help="Google Maps API key (Places API enabled)",
    )
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parents[1] / "public" / "geo" / "places-bejaia.json"),
    )
    args = parser.parse_args()

    if not args.api_key or args.api_key == "VOTRE_CLE_API_ICI":
        print(
            "Missing API key. Set GOOGLE_MAPS_API_KEY or pass --api-key=...",
            file=sys.stderr,
        )
        return 2

    raw = fetch_places(args.api_key)
    places = to_app_places(raw)
    payload = {
        "wilayaCode": WILAYA_CODE,
        "wilaya": "Béjaïa",
        "wilaya_ar": "بجاية",
        "center": BEJAIA_CENTER,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(places),
        "places": places,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{len(places)} établissements uniques → {out_path}")
    for p in places[:15]:
        print(f"- {p['name']} ({p['structureKind']}) — {p['address']}")
    if len(places) > 15:
        print(f"... +{len(places) - 15} autres")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
