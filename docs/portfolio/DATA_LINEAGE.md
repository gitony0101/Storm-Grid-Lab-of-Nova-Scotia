# StormGrid Data Lineage

## Classification Scheme

| Class | Meaning |
| --- | --- |
| observed outage data | Public outage-history-derived signal used for context or labels |
| measured GIS | External geographic or infrastructure data with real source geometry or locations |
| derived proxy | Feature computed from source data or approximate spatial joins |
| seed proxy | Manually seeded or heuristic value used because measured data is missing |
| scenario approximation | Plausible storm or scenario value, not exact observed meteorology |
| generated score | Model output or display score generated from formulas |
| synthetic prior | Stress-test, pseudo-label, or synthetic benchmark signal |
| diagnostic experiment output | Offline experiment result not promoted to production claims |
| invalid or superseded output | Artifact that must not support portfolio claims except as governance evidence |

## Important Files

| File | Class | Allowed use | Not allowed use |
| --- | --- | --- | --- |
| `public/data/hrm_community_features.json` | seed proxy, derived proxy, observed outage data | Active HRM feature contract and limitation example | Treat as official boundary or measured utility infrastructure truth |
| `public/data/community_hazard_modifiers.json` | derived proxy | Community-specific wind/rain/tide modifiers | Claim exact physical exposure measurement |
| `public/data/model_weight_profiles.json` | model configuration | Source of active default and profile weights | Treat archived candidate weights as active |
| `public/data/community_model_profiles.json` | model configuration | Map communities to active profile IDs | Claim learned personalization |
| `public/data/hrm_storm_replay_events.json` | scenario approximation | Replay scenario definitions | Claim exact historical meteorological reconstruction |
| `public/data/hrm_storm_replay_matrix.json` | generated score, diagnostic replay output | Ranking replay evidence and data lineage example | Forecasting proof |
| `public/data/ranking_metrics.json` | diagnostic experiment output | Diagnostic ranking metrics | Independent validation proof |
| `public/data/leave_one_storm_out_metrics.json` | diagnostic experiment output | Rank-stability diagnostic | Generalization proof |
| `public/data/ablation_metrics.json` | diagnostic experiment output | Component sensitivity and audit evidence | Primary validation proof |
| `public/data/risk_calibration_bins.json` | diagnostic experiment output | Score-band diagnostics | Probability calibration |
| `public/data/model_sensitivity_report.json` | diagnostic experiment output | Sensitivity summary | Forecasting performance evidence |
| `public/data/model_validation_status.json` | governance summary | Safe claims, blocked claims, future data needs | Claim all limitations are resolved |
| `public/data/model_code_audit_summary.json` | governance summary | Formula, data, and claim audit evidence | Claim zero remaining risk |
| `public/data/strict_model_audit_summary.json` | invalid/superseded audit evidence | Explain why province-wide TabPFN results are shelved | Use TabPFN metrics as production support |
| `public/data/ns_frontend_map_points.json` | generated score, diagnostic layer | Province diagnostic overview | Claim final V7 direct lineage or official planning truth |
| `public/data/ns_frontend_map_points_lineage.json` | governance summary | Explain diagnostic status of the NS frontend layer | Ignore lineage caveats |
| `public/data/community_storm_training.csv` | restricted diagnostic artifact | Diagnostic lineage only | Canonical training, validation, or formula changes |
| `public/data/ns_community_storm_training.csv` | restricted diagnostic artifact | Diagnostic lineage only | Public portfolio evidence for production model strength |
| `public/data/ns_tabpfn_benchmark_results.json` | invalid or superseded output | Governance lesson only | Claim TabPFN supports the final model |
| `public/data/source_cache/` | measured GIS source cache | Local rebuild source evidence | Ship as lightweight portfolio data |
| `public/data/archive/` | archive | Historical audit trail | Active source of truth without review |
| `experiments/stormgrid_final_data_trust_freeze_20260523/outputs/quarantine_registry.json` | governance summary | Cleanup and quarantine decisions | Treat as completed cleanup |
| `experiments/stormgrid_v4_tabpfn_retry_20260523/` | diagnostic experiment output | Explain excluded advanced ML attempt | Claim deployed or ranked TabPFN performance |
| `experiments/stormgrid_v7b_no_prior_ablation_realrun_20260523/` | diagnostic experiment output | Explain high NDCG as diagnostic ablation | Claim production promotion |

## V4 TabPFN and NS Training CSV

Repository evidence confirms V4 TabPFN is archived/offline diagnostic:

- `tabpfn_governance_gate_result.json` has `overall_pass: false`, `production_ready: false`, and `tabpfn_retry_role: offline_diagnostic_evidence_only`.
- `tabpfn_summary_for_pitch.json` says no successful fit completed and no valid metric is available.
- The final data trust freeze restricts `public/data/ns_community_storm_training.csv` and `public/data/community_storm_training.csv` to diagnostic lineage only.

Conclusion: V4 TabPFN and `ns_community_storm_training.csv` are not safe as portfolio validation evidence. They are safe only as examples of audit governance and excluded experiment handling.

## Active Data Flow

```text
HRM feature contract
  -> communityRiskEngine.ts
  -> generated community scores
  -> HRM map and panels

Weight profiles
  -> modelWeights.ts
  -> active profile weights
  -> communityRiskEngine.ts

Replay matrix and metrics
  -> validation summaries
  -> diagnostic ranking evidence
  -> portfolio limitations
```

## Data Trust Summary

StormGrid has enough evidence for a transparent portfolio prototype and response-priority ranking demo. It does not have enough independent observed storm-event evidence for strong forecasting claims. The clean public repo should keep active source-of-truth files, archive diagnostic experiments, and exclude restricted or oversized local artifacts.
