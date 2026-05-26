#!/usr/bin/env python3
"""
Build HRM Storm Replay Matrix (v2.2.0)

For each of the 5 storm-event replays and each of the 15 HRM communities,
run the full 3-layer risk model (exact replica of the TS engine) and
output predicted rankings alongside observed outage signals.

Phase 3 additions:
- Per-community wind/rain/tide hazard modifiers
- Urban load proxy
- Storm-relative labels (top-30%)
- Formula parity with computeAdjustedHazard in TS

Usage:
    python3 scripts/build_hrm_storm_replay_matrix.py
"""

import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ml_common import get_default_weights

SHRINKAGE_K = 20
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LIMITATION = "Community centroid proxy, not official polygon boundary. StormGrid output is response priority, not outage probability."
MODEL_VERSION = "2.2.0"
WEIGHTS = get_default_weights()


# ---------------------------------------------------------------------------
# Exact replica of TS computeHazardScore (hazardModel.ts)
# ---------------------------------------------------------------------------

def compute_hazard_score(ws, rs, ts, scenario_id=None):
    """
    TS: windNorm = clamp01(windSpeed/10)  -> windSpeed is 0-10
    But for replay events we feed wind_score directly as 0-1, so treat it
    as already-normalized: wind_score * 100.
    """
    wind_score = clamp(ws * 100)
    rain_score = clamp(rs * 100)
    tide_score = clamp(ts * 100)
    hazard_score = (wind_score + rain_score + tide_score) / 3
    return {
        "wind_score": round(wind_score, 2),
        "rain_score": round(rain_score, 2),
        "tide_score": round(tide_score, 2),
        "hazard_score": round(hazard_score, 2),
    }


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


# ---------------------------------------------------------------------------
# v2.2.0: Community hazard modifier application (replica of TS computeAdjustedHazard)
# ---------------------------------------------------------------------------

def compute_adjusted_hazard(community, wind_score, rain_score, tide_score, modifiers_data):
    """
    Replica of TS computeAdjustedHazard (hazardModifiers.ts).
    
    Applies per-community wind/rain/tide exposure modifiers to the base
    storm hazard sub-scores, then computes the equal-weight composite.
    
    Returns dict with: community_wind, community_rain, community_tide, community_hazard
    """
    mods = modifiers_data.get("modifiers", {})
    comm_mods = mods.get(community, None)
    
    if comm_mods is None:
        return {
            "community_wind": wind_score,
            "community_rain": rain_score,
            "community_tide": tide_score,
            "community_hazard": (wind_score + rain_score + tide_score) / 3,
        }
    
    wind_mod = comm_mods.get("wind_exposure_modifier", 1.0)
    rain_mod = comm_mods.get("rain_exposure_modifier", 1.0)
    tide_mod = comm_mods.get("tide_exposure_modifier", 1.0)
    
    community_wind = round(wind_score * wind_mod, 1)
    community_rain = round(rain_score * rain_mod, 1)
    community_tide = round(tide_score * tide_mod, 1)
    community_hazard = round((community_wind + community_rain + community_tide) / 3, 1)
    
    return {
        "community_wind": community_wind,
        "community_rain": community_rain,
        "community_tide": community_tide,
        "community_hazard": community_hazard,
    }


def get_modifier_values(community, modifiers_data):
    """Return the modifier values for a community (wind, rain, tide)."""
    mods = modifiers_data.get("modifiers", {})
    comm_mods = mods.get(community, None)
    if comm_mods is None:
        return 1.0, 1.0, 1.0
    return (
        comm_mods.get("wind_exposure_modifier", 1.0),
        comm_mods.get("rain_exposure_modifier", 1.0),
        comm_mods.get("tide_exposure_modifier", 1.0),
    )


# ---------------------------------------------------------------------------
# Exact replica of TS computeVulnerabilityScore (vulnerabilityModel.ts)
# TS weights: tree 30%, lowland 20%, rural 20%, coastal 15%, access 15%
# ---------------------------------------------------------------------------

def compute_vulnerability_score(f):
    raw = (
        0.30 * clamp(f["tree_exposure"], 0, 1) +
        0.20 * clamp(f["lowland_exposure"], 0, 1) +
        0.20 * clamp(f["rural_line_proxy"], 0, 1) +
        0.15 * clamp(f["coastal_exposure"], 0, 1) +
        0.15 * clamp(f["critical_access_score"], 0, 1)
    )
    return round(clamp(raw * 100) * 10) / 10


# ---------------------------------------------------------------------------
# Exact replica of TS computeHistoricalPrior (calibrationModel.ts)
# ---------------------------------------------------------------------------

def compute_historical_prior(n_outage_events, community_type, all_feats):
    max_events = max(c["n_outage_events"] for c in all_feats)
    if max_events < 1:
        max_events = 1

    def clamp01_rate(n):
        return max(0, min(1, n / max_events))

    local_rate = clamp01_rate(n_outage_events)
    peers = [c for c in all_feats if c["community_type"] == community_type]
    peer_count = len(peers) if peers else 1
    peer_mean = sum(clamp01_rate(c["n_outage_events"]) for c in peers) / peer_count

    local_weight = n_outage_events / (n_outage_events + SHRINKAGE_K)
    historical_prior = local_weight * local_rate + (1 - local_weight) * peer_mean

    if n_outage_events >= 30:
        conf = "High"
    elif n_outage_events >= 8:
        conf = "Medium"
    else:
        conf = "Low"

    return round(historical_prior * 1000) / 1000, conf


# ---------------------------------------------------------------------------
# Replica of topDriversFor (communityRiskEngine.ts)
# ---------------------------------------------------------------------------

def top_drivers(hazard, vuln, hp, wti, rli):
    drivers = [
        ("Hazard exposure", round(hazard * WEIGHTS["community_hazard"] * 100) / 100),
        ("Vulnerability factors", round(vuln * WEIGHTS["vulnerability"] * 100) / 100),
        ("Historical outage prior", round(hp * WEIGHTS["historical_prior"] * 100) / 100),
    ]
    if wti > 0:
        drivers.append(("Wind-tree interaction", round(wti * WEIGHTS["wind_tree"] * 100) / 100))
    if rli > 0:
        drivers.append(("Rain-lowland interaction", round(rli * WEIGHTS["rain_lowland"] * 100) / 100))
    drivers.sort(key=lambda x: x[1], reverse=True)
    return [{"driver": d, "contribution": c} for d, c in drivers]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Load feature data
    with open(PROJECT_ROOT / "public" / "data" / "hrm_community_features.json") as f:
        feat_data = json.load(f)
    features = feat_data["communities"]

    # Load hazard modifiers (v2.2.0)
    modifiers_path = PROJECT_ROOT / "public" / "data" / "community_hazard_modifiers.json"
    if modifiers_path.exists():
        with open(modifiers_path) as f:
            modifiers_data = json.load(f)
        print(f"[INFO] Loaded hazard modifiers from {modifiers_path}")
    else:
        modifiers_data = {"modifiers": {}}
        print("[WARN] community_hazard_modifiers.json not found — using default 1.0")

    # Load replay events
    with open(PROJECT_ROOT / "public" / "data" / "hrm_storm_replay_events.json") as f:
        replay_data = json.load(f)
    events = replay_data["storm_events"]

    # Load risk summary for observed outage signals (per-community constant)
    with open(PROJECT_ROOT / "public" / "data" / "hrm_community_risk_summary.json") as f:
        summary_data = json.load(f)
    summary_map = {c["community"]: c for c in summary_data["communities"]}

    # Load storm-relative labels (v2.2.0) if available
    storm_relative_labels_path = PROJECT_ROOT / "public" / "data" / "storm_relative_labels.json"
    storm_relative_labels = None
    label_source = None
    label_limitation = None
    if storm_relative_labels_path.exists():
        with open(storm_relative_labels_path) as f:
            storm_relative_labels = json.load(f)
        label_source = "storm_relative_top30_label"
        label_limitation = storm_relative_labels.get("metadata", {}).get("limitation", "")
        print(f"[INFO] Loaded storm-relative labels from {storm_relative_labels_path}")

    # Precompute per-community calibration
    community_calib = {}
    for feat in features:
        prior, conf = compute_historical_prior(
            feat["n_outage_events"], feat["community_type"], features
        )
        community_calib[feat["community"]] = (prior, conf)

    # Build label lookup: { storm_event_id: { community_name: storm_relative_top30_label } }
    label_lookup = {}
    if storm_relative_labels:
        for event in storm_relative_labels.get("events", []):
            eid = event["storm_event_id"]
            label_lookup[eid] = {}
            for comm in event.get("communities", []):
                label_lookup[eid][comm["community"]] = comm.get("storm_relative_top30_label", 0)

    rows = []
    for evt in events:
        eid = evt["storm_event_id"]
        haz = compute_hazard_score(
            evt["wind_score"], evt["rain_score"], evt["tide_score"],
            scenario_id=eid,
        )

        storm_rows = []
        for feat in features:
            name = feat["community"]
            vuln = compute_vulnerability_score(feat)
            hp_prior, conf = community_calib[name]

            tree = feat["tree_exposure"]
            lowland = feat["lowland_exposure"]

            # v2.2.0: Apply wind/rain/tide hazard modifiers
            adjusted = compute_adjusted_hazard(
                name,
                haz["wind_score"],
                haz["rain_score"],
                haz["tide_score"],
                modifiers_data,
            )
            wind_mod, rain_mod, tide_mod = get_modifier_values(name, modifiers_data)

            # Interaction terms (use raw wind/rain scores, not community-adjusted)
            wind_tree_interaction = (haz["wind_score"] / 100) * tree * 100
            rain_lowland_interaction = (haz["rain_score"] / 100) * lowland * 100

            # Final risk: v2.2.0 uses adjusted community_hazard (not raw hazard_score)
            raw_risk = (
                WEIGHTS["community_hazard"] * adjusted["community_hazard"] +
                WEIGHTS["vulnerability"] * vuln +
                WEIGHTS["historical_prior"] * hp_prior +
                WEIGHTS["wind_tree"] * wind_tree_interaction +
                WEIGHTS["rain_lowland"] * rain_lowland_interaction
            )
            risk_score = round(clamp(round(raw_risk * 10) / 10, 0, 100), 1)

            band = (
                "Critical" if risk_score >= 75
                else "High" if risk_score >= 55
                else "Moderate" if risk_score >= 35
                else "Low"
            )

            sumc = summary_map.get(name, {})
            obs_count = sumc.get("outage_count", 0)
            obs_signal = sumc.get("historical_outage_score", 0)

            # Urban load proxy
            urban_load = feat.get("urban_load_proxy", None)

            # Storm-relative label
            storm_label = None
            if label_lookup and eid in label_lookup:
                storm_label = label_lookup[eid].get(name, None)

            row = {
                "model_version": MODEL_VERSION,
                "storm_event_id": eid,
                "community_name": name,
                "risk_score": risk_score,
                "risk_band": band,
                "confidence": conf,
                "hazard_score": adjusted["community_hazard"],  # v2.2.0: community-adjusted hazard
                "wind_score": haz["wind_score"],
                "rain_score": haz["rain_score"],
                "tide_score": haz["tide_score"],
                "community_wind": adjusted["community_wind"],
                "community_rain": adjusted["community_rain"],
                "community_tide": adjusted["community_tide"],
                "community_hazard": adjusted["community_hazard"],
                "wind_exposure_modifier": wind_mod,
                "rain_exposure_modifier": rain_mod,
                "tide_exposure_modifier": tide_mod,
                "vulnerability_score": vuln,
                "historical_prior_score": round(hp_prior, 1),
                "wind_tree_interaction": round(wind_tree_interaction, 1),
                "rain_lowland_interaction": round(rain_lowland_interaction, 1),
                "observed_outage_signal": obs_signal,
                "observed_outage_count": obs_count,
                "urban_load_proxy": urban_load,
                "top_drivers": top_drivers(
                    adjusted["community_hazard"], vuln, hp_prior,
                    wind_tree_interaction, rain_lowland_interaction
                ),
                "limitation": LIMITATION,
            }

            # Add storm-relative label if available
            if storm_label is not None:
                row["storm_relative_top30_label"] = storm_label
                row["label_source"] = label_source
                row["label_limitation"] = label_limitation

            storm_rows.append(row)

        # Assign predicted_rank within storm
        storm_rows.sort(key=lambda x: x["risk_score"], reverse=True)
        for i, row in enumerate(storm_rows):
            row["predicted_rank"] = i + 1
        rows.extend(storm_rows)

    # Write output
    out = {
        "model_version": MODEL_VERSION,
        "metadata": {
            "generated_at": "build-time",
            "storm_event_count": len(events),
            "community_count": len(features),
            "total_rows": len(rows),
            "limitation": LIMITATION,
            "note": replay_data["metadata"]["note"],
        },
        "storm_events": [
            {"storm_event_id": e["storm_event_id"], "label": e["label"]}
            for e in events
        ],
        "replay_results": rows,
    }
    out_path = PROJECT_ROOT / "public" / "data" / "hrm_storm_replay_matrix.json"
    with open(out_path, "w") as f:
        json.dump(out, f, indent=2)

    print(f"Written {out_path}")
    print(f"  {len(events)} storm events x {len(features)} communities = {len(rows)} rows")

    # Summary per storm
    for evt in events:
        eid = evt["storm_event_id"]
        e_rows = [r for r in rows if r["storm_event_id"] == eid]
        top3 = sorted(e_rows, key=lambda x: x["risk_score"], reverse=True)[:3]
        print(f"\n  {evt['label']} (top-3 predicted):")
        for r in top3:
            label_str = ""
            if r.get("storm_relative_top30_label") is not None:
                label_str = f", top30_label={r['storm_relative_top30_label']}"
            print(f"    #{r['predicted_rank']} {r['community_name']}: "
                  f"risk={r['risk_score']:.1f}, "
                  f"obs_count={r['observed_outage_count']}"
                  f"{label_str}")


if __name__ == "__main__":
    main()
