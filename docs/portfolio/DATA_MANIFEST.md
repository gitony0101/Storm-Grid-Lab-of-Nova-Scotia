# StormGrid: Data Manifest

## Runtime Data Included

The public repository includes only the data files needed to run the demo and understand the model. These are lightweight JSON files in `public/data/`:

- `community_hazard_modifiers.json` — wind, rain, and tide modifiers per community
- `community_model_profiles.json` — community-level profile assignments
- `deployment_recommendations_by_scenario.json` — scenario deployment notes
- `hrm_community_features.json` — community feature values for the HRM scoring path
- `hrm_storm_replay_events.json` — replay event parameters
- `hrm_storm_replay_matrix.json` — replay data for validation
- `leave_one_storm_out_metrics.json` — LOSO stability metrics
- `model_code_audit_summary.json` — code structure audit
- `model_sensitivity_report.json` — sensitivity analysis results
- `model_validation_status.json` — validation position and evidence
- `model_weight_profiles.json` — weight profile definitions
- `ns_frontend_map_points.json` — Nova Scotia diagnostic map data
- `ranking_metrics.json` — ranking diagnostic metrics
- `risk_calibration_bins.json` — score band distribution
- `ablation_metrics.json` — component ablation diagnostics

## Large Data Excluded

The following are not in the public repository:

- Raw GIS shapefiles and GeoJSON source data
- Source cache directories (source_cache/)
- Archive directories (archive/)
- HDF5 tensor datasets
- Training and evaluation artifacts from offline experiments

## Restricted Diagnostics Excluded

Advanced model experiment outputs (TabPFN benchmarks, challenger metrics, Bayesian optimization traces) are excluded from the public repository. References to these experiments in validation documentation are evidence summaries, not raw exports.

## File Size Policy

All public data files are under 1 MB. Total `public/data/` size is approximately 500 KB.

## Reproducibility Strategy

The scoring engine is fully reproducible from the TypeScript source code and runtime data files. The numerical parity check (`scripts/numerical_parity_check.py`) verifies that a Python reference implementation produces identical scores for the same inputs. Full experiment reproduction (offline challenger models) requires data and model configuration not in the public repository.

## External Evidence Bundle

Validation metrics, sensitivity analysis, and model audit summaries are included as JSON files in `public/data/`. These are pre-computed outputs intended for documentation and verification. Raw computation logs, intermediate experiment states, and agent-generated analysis are not included.