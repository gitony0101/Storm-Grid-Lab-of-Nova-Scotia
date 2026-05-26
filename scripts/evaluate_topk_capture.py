#!/usr/bin/env python3
"""
Evaluate Top-K Capture Rates from Storm Replay Matrix

For each storm event replay, compute whether the top-N predicted
communities (by risk_score) capture the highest observed outage counts.

Usage:
    python3 scripts/evaluate_topk_capture.py
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = PROJECT_ROOT / "public" / "data" / "model_metrics_topk.json"
LIMITATION = "Community centroid proxy, not official polygon boundary."


def main():
    with open(PROJECT_ROOT / "public" / "data" / "hrm_storm_replay_matrix.json") as f:
        matrix = json.load(f)

    rows = matrix["replay_results"]
    storms = {e["storm_event_id"]: e for e in matrix["storm_events"]}

    total_top3_correct = 0
    total_top5_correct = 0
    total_evaluated = 0
    all_top3_observed = []
    all_non_top3_observed = []

    results_per_storm = []

    for eid in storms:
        storm_rows = [r for r in rows if r["storm_event_id"] == eid]
        if len(storm_rows) < 3:
            continue

        total_evaluated += 1

        # Ground truth: top-3 by observed_outage_count
        by_obs = sorted(storm_rows, key=lambda x: x["observed_outage_count"], reverse=True)
        top3_obs_names = {r["community_name"] for r in by_obs[:3]}
        top5_obs_names = {r["community_name"] for r in by_obs[:5]}

        # Predicted: top-3 and top-5 by risk_score
        by_pred = sorted(storm_rows, key=lambda x: x["risk_score"], reverse=True)
        top3_pred_names = {r["community_name"] for r in by_pred[:3]}
        top5_pred_names = {r["community_name"] for r in by_pred[:5]}

        top3_hits = len(top3_pred_names & top3_obs_names)
        top3_hit_rate = top3_hits / 3.0
        total_top3_correct += top3_hits

        top5_hits = len(top5_pred_names & top5_obs_names)
        top5_hit_rate = top5_hits / 5.0
        total_top5_correct += top5_hits

        # Average observed outage counts for predicted top-3 vs others
        for r in by_pred:
            if r["community_name"] in top3_pred_names:
                all_top3_observed.append(r["observed_outage_count"])
            else:
                all_non_top3_observed.append(r["observed_outage_count"])

        results_per_storm.append({
            "storm_event_id": eid,
            "label": storms[eid]["label"],
            "top3_capture": top3_hits,
            "top3_capture_rate": round(top3_hit_rate, 2),
            "top5_capture": top5_hits,
            "top5_capture_rate": round(top5_hit_rate, 2),
        })

    n_storms = total_evaluated
    n_communities = len([r for r in rows if r["storm_event_id"] == list(storms.keys())[0]]) if storm_rows else 0

    avg_top3_outage = round(sum(all_top3_observed) / len(all_top3_observed), 1) if all_top3_observed else 0
    avg_non_top3_outage = round(sum(all_non_top3_observed) / len(all_non_top3_observed), 1) if all_non_top3_observed else 0

    overall_top3_rate = round(total_top3_correct / (n_storms * 3), 2) if n_storms else 0
    overall_top5_rate = round(total_top5_correct / (n_storms * 5), 2) if n_storms else 0

    metrics = {
        "generated_at": "build-time",
        "storms_evaluated": n_storms,
        "communities_evaluated": n_communities,
        "top3_capture_rate_rule_score": overall_top3_rate,
        "top5_capture_rate_rule_score": overall_top5_rate,
        "average_top3_observed_outage_count": avg_top3_outage,
        "average_non_top3_observed_outage_count": avg_non_top3_outage,
        "per_storm_results": results_per_storm,
        "validation_note": (
            f"Top-3 capture rate {overall_top3_rate} across {n_storms} replay storms. "
            "Model uses community centroid proxy features (0-1 seeded values), not measured GIS data. "
            "Observed outage signals are proximity-aggregated historical counts, not official polygon joins. "
            f"{LIMITATION} Not asset-level or address-level modeling."
        ),
        "limitation": LIMITATION,
    }

    with open(OUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Written {OUT_PATH}")
    print(f"\nTop-K Capture Summary:")
    print(f"  Storms evaluated: {n_storms}")
    print(f"  Communities per storm: {n_communities}")
    print(f"  Top-3 capture rate: {overall_top3_rate}")
    print(f"  Top-5 capture rate: {overall_top5_rate}")
    print(f"  Avg top-3 observed outages: {avg_top3_outage}")
    print(f"  Avg non-top-3 observed outages: {avg_non_top3_outage}")

    print(f"\nPer-storm detail:")
    for r in results_per_storm:
        print(f"  {r['label']}: top-3={r['top3_capture']}/3 ({r['top3_capture_rate']}), "
              f"top-5={r['top5_capture']}/5 ({r['top5_capture_rate']})")


if __name__ == "__main__":
    main()
