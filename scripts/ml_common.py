from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / "public" / "data"
MODEL_DIR = ROOT / "models"
WEIGHT_PROFILES_PATH = PUBLIC_DATA / "model_weight_profiles.json"
HAZARD_MODIFIERS_PATH = PUBLIC_DATA / "community_hazard_modifiers.json"


# ---------------------------------------------------------------------------
# Weight profile loading helpers — always read from JSON, never hardcoded
# ---------------------------------------------------------------------------

def _load_all_profiles() -> dict[str, dict[str, float]]:
    with open(WEIGHT_PROFILES_PATH) as f:
        data = json.load(f)
    return data["profiles"]

def load_weight_profiles(profile_id: str = "default") -> dict[str, float]:
    """Load a single weight profile from model_weight_profiles.json.
    
    Args:
        profile_id: Profile key (default='default').

    Returns:
        Dict of component weights for the named profile.
    """
    profiles = _load_all_profiles()
    if profile_id not in profiles:
        raise KeyError(f"Profile '{profile_id}' not found in {WEIGHT_PROFILES_PATH}. Available: {list(profiles.keys())}")
    return profiles[profile_id]

def get_default_weights() -> dict[str, float]:
    """Return the default weight profile."""
    return load_weight_profiles("default")

# ---------------------------------------------------------------------------
# Hazard modifier loading helpers (v2.1.0)
# ---------------------------------------------------------------------------

_HAZARD_MODIFIERS_CACHE: dict[str, float] | None = None

def load_hazard_modifiers() -> dict[str, float]:
    """Load community hazard modifiers from community_hazard_modifiers.json.

    Returns:
        Dict mapping community name to hazard modifier value.
    """
    global _HAZARD_MODIFIERS_CACHE
    if _HAZARD_MODIFIERS_CACHE is not None:
        return _HAZARD_MODIFIERS_CACHE

    if not HAZARD_MODIFIERS_PATH.exists():
        # File not present — return empty dict; apply_hazard_modifier defaults to 1.0
        _HAZARD_MODIFIERS_CACHE = {}
        return _HAZARD_MODIFIERS_CACHE

    with open(HAZARD_MODIFIERS_PATH) as f:
        data = json.load(f)

    modifiers: dict[str, float] = {}
    for community, entry in data.get("modifiers", {}).items():
        modifiers[community] = entry.get("hazard_modifier", 1.0)

    _HAZARD_MODIFIERS_CACHE = modifiers
    return modifiers


def apply_hazard_modifier(community: str, base_hazard: float) -> float:
    """Apply the community hazard modifier to a base hazard score.

    Returns base_hazard * modifier. Defaults to 1.0 if community not found.
    """
    modifiers = load_hazard_modifiers()
    modifier = modifiers.get(community, 1.0)
    return base_hazard * modifier



def compute_community_risk(weights: dict[str, float],
                           community_hazard: float,
                           vulnerability: float,
                           historical_prior: float,
                           wind_tree: float,
                           rain_lowland: float) -> float:
    """Compute composite risk using the v2 weight formula.

    Formula (mirrors TypeScript communityRiskEngine):
        risk = w_hazard * hazard + w_vuln * vulnerability
             + w_prior * historical_prior + w_windtree * wind_tree
             + w_rainlowland * rain_lowland
    """
    raw = (weights["community_hazard"] * community_hazard
           + weights["vulnerability"] * vulnerability
           + weights["historical_prior"] * historical_prior
           + weights["wind_tree"] * wind_tree
           + weights["rain_lowland"] * rain_lowland)
    return raw


@dataclass(frozen=True)
class Zone:
    id: str
    name: str
    district: str
    lat: float
    lon: float
    base: dict[str, float]


def ensure_dirs() -> None:
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def clamp01(value: float) -> float:
    if math.isnan(value):
        return 0.0
    return max(0.0, min(1.0, float(value)))


def normalize(series: pd.Series) -> pd.Series:
    s = pd.to_numeric(series, errors="coerce").fillna(0)
    lo = float(s.min())
    hi = float(s.max())
    if hi <= lo:
        return pd.Series(np.zeros(len(s)), index=s.index)
    return (s - lo) / (hi - lo)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def load_zones() -> list[Zone]:
    source = ROOT / "src" / "data" / "halifaxZones.ts"
    text = source.read_text()
    blocks = re.findall(r"\{\s*id: '([^']+)'.*?base: \{(.*?)\}\s*,?\n\s*\}", text, re.S)
    zones: list[Zone] = []
    for zone_id, base_text in blocks:
        obj_start = text.rfind("{", 0, text.find(f"id: '{zone_id}'"))
        obj_end = text.find("  },", text.find(f"id: '{zone_id}'"))
        obj_text = text[obj_start:obj_end]
        name = re.search(r"name: ([\"'])(.*?)\1", obj_text, re.S)
        district = re.search(r"district: '([^']+)'", obj_text)
        coords = re.search(r"coordinates: \[([-0-9.]+),\s*([-0-9.]+)\]", obj_text)
        base = {k: float(v) for k, v in re.findall(r"(\w+):\s*([-0-9.]+)", base_text)}
        if name and district and coords:
            zones.append(
                Zone(
                    id=zone_id,
                    name=name.group(2),
                    district=district.group(1),
                    lat=float(coords.group(1)),
                    lon=float(coords.group(2)),
                    base=base,
                )
            )
    if not zones:
        raise RuntimeError(f"No zones parsed from {source}")
    return zones


def read_outages() -> pd.DataFrame:
    path = ROOT / "src" / "data" / "nsOutageHistory.csv"
    outages = pd.read_csv(path)
    for col in ["first_observed", "last_observed", "min_start", "max_etr"]:
        outages[col] = pd.to_datetime(outages[col], errors="coerce", utc=True)
    outages["duration_hours"] = (
        (outages["last_observed"] - outages["first_observed"]).dt.total_seconds() / 3600
    ).clip(lower=0)
    return outages


def assign_nearest_zone(outages: pd.DataFrame, zones: list[Zone]) -> pd.DataFrame:
    rows = []
    for _, row in outages.iterrows():
        lat = row.get("latitude")
        lon = row.get("longitude")
        if pd.isna(lat) or pd.isna(lon):
            rows.append((None, np.nan))
            continue
        nearest = min(zones, key=lambda z: haversine_km(lat, lon, z.lat, z.lon))
        dist = haversine_km(lat, lon, nearest.lat, nearest.lon)
        rows.append((nearest.id, dist))
    assigned = outages.copy()
    assigned["zone_id"] = [r[0] for r in rows]
    assigned["zone_distance_km"] = [r[1] for r in rows]
    return assigned


def zone_static_frame(zones: list[Zone], outages: pd.DataFrame | None = None) -> pd.DataFrame:
    records: list[dict[str, Any]] = []
    if outages is not None and "zone_id" in outages:
        grouped = outages.groupby("zone_id")
    else:
        grouped = None

    for i, z in enumerate(zones):
        base = z.base
        outage_count = int(grouped.size().get(z.id, 0)) if grouped is not None else 0
        max_customers = float(grouped["max_cust_aff"].max().get(z.id, 0)) if grouped is not None else 0
        avg_duration = float(grouped["duration_hours"].mean().get(z.id, 0)) if grouped is not None else 0
        pop = base["populationExposure"]
        buildings = int(round(80 + pop * 360 + base["powerVulnerability"] * 120 + i * 7))
        roads = round(2.0 + (1 - base["roadAccessRisk"]) * 2.5 + pop * 1.5, 3)
        critical = int(round(1 + pop * 4 + (1 - base["shelterDistance"]) * 3))
        shelters = int(round(max(0, 4 - base["shelterDistance"] * 5)))
        records.append(
            {
                "zone_id": z.id,
                "zone_name": z.name,
                "district": z.district,
                "lat": z.lat,
                "lon": z.lon,
                "flood_exposure": base["floodExposure"],
                "coastal_exposure": base["floodExposure"],
                "wind_exposure": base["windExposure"],
                "elevation_or_lowland_proxy": 1 - base["elevationRisk"],
                "power_vulnerability_proxy": base["powerVulnerability"],
                "road_access_penalty": base["roadAccessRisk"],
                "shelter_distance": base["shelterDistance"],
                "population_proxy": pop,
                "building_count": buildings,
                "building_density": clamp01(buildings / 520),
                "road_density": roads,
                "bridge_or_structure_count": int(round(1 + base["roadAccessRisk"] * 8 + base["floodExposure"] * 4)),
                "wet_area_score": clamp01(base["floodExposure"] * 0.65 + (1 - base["elevationRisk"]) * 0.35),
                "critical_facility_count": critical,
                "shelter_count": shelters,
                "generator_candidate_count": max(1, shelters + int(critical > 4)),
                "historical_outage_frequency": outage_count,
                "historical_max_customers_affected": max_customers,
                "historical_avg_duration_hours": avg_duration,
            }
        )
    df = pd.DataFrame(records)
    for col in ["historical_outage_frequency", "historical_max_customers_affected", "historical_avg_duration_hours", "road_density"]:
        df[col + "_norm"] = normalize(df[col])
    return df


SCENARIOS: dict[str, dict[str, float | str]] = {
    "normal": {
        "label": "Normal Conditions",
        "max_wind_speed": 22,
        "mean_wind_speed": 13,
        "total_precip": 3,
        "max_precip_intensity": 1,
        "wind_direction": 230,
        "temperature": 10,
        "max_tide_level": 1.1,
    },
    "heavyRainHighTide": {
        "label": "High Tide + Heavy Rain",
        "max_wind_speed": 48,
        "mean_wind_speed": 30,
        "total_precip": 65,
        "max_precip_intensity": 14,
        "wind_direction": 170,
        "temperature": 8,
        "max_tide_level": 2.1,
    },
    "fionaWindCascade": {
        "label": "Fiona-style Wind Cascade",
        "max_wind_speed": 115,
        "mean_wind_speed": 72,
        "total_precip": 45,
        "max_precip_intensity": 8,
        "wind_direction": 80,
        "temperature": 15,
        "max_tide_level": 1.8,
    },
    "worstCascade": {
        "label": "Worst Cascade",
        "max_wind_speed": 125,
        "mean_wind_speed": 82,
        "total_precip": 95,
        "max_precip_intensity": 18,
        "wind_direction": 90,
        "temperature": 6,
        "max_tide_level": 2.4,
    },
}
