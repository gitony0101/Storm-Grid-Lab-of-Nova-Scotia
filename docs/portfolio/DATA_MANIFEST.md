# StormGrid Data Manifest

## 1. Runtime Data Included In Repo

This public portfolio repository includes only lightweight runtime data needed to run, inspect, and validate the demo:

- `public/data/model_weight_profiles.json`
- `public/data/community_model_profiles.json`
- `public/data/hrm_community_features.json`
- `public/data/hrm_storm_replay_events.json`
- `public/data/hrm_storm_replay_matrix.json`
- `public/data/community_hazard_modifiers.json`
- `public/data/deployment_recommendations_by_scenario.json`
- `public/data/ranking_metrics.json`
- `public/data/ablation_metrics.json`
- `public/data/leave_one_storm_out_metrics.json`
- `public/data/risk_calibration_bins.json`
- `public/data/model_sensitivity_report.json`
- `public/data/model_validation_status.json`
- `public/data/model_code_audit_summary.json`
- `public/data/stormgrid_claims_guardrails.json`

These files support the browser demo, portfolio explanation, and numerical parity checks. They are small enough for ordinary GitHub hosting and code review.

## 2. Large Data Intentionally Excluded

The public repository intentionally excludes:

- raw GIS source caches;
- large generated GIS artifacts;
- archived experiment outputs;
- restricted diagnostic artifacts;
- old `ns_ml3`, `ns_ml5`, and `ns_ml6` outputs;
- TabPFN diagnostic outputs;
- local virtual environments;
- dependency folders;
- build artifacts.

## 3. Why These Files Are Excluded

Raw GIS caches and large generated files are excluded because they are bulky, reproducible from source pipelines, and not needed to run the public demo.

Archived experiments and restricted diagnostics are excluded because they are governance history, not active portfolio evidence. Some contain superseded, synthetic, circular-prior, or same-source diagnostic results that should not be interpreted as production capability.

Dependency folders and build artifacts are excluded because they can be regenerated from `package-lock.json` and the source tree.

## 4. Reproducibility

Reproducibility is preserved through:

- source-controlled TypeScript scoring code;
- source-controlled active runtime JSON;
- `scripts/numerical_parity_check.py`;
- selected evaluation and QA scripts;
- `docs/portfolio/DATA_LINEAGE.md`;
- `docs/portfolio/VALIDATION_REPORT.md`;
- `docs/portfolio/MODEL_CARD.md`;
- `PUBLIC_EXPORT_REPORT.md`.

The public repository supports demo reproduction and formula verification. It does not attempt to preserve every exploratory artifact in public Git history.

## 5. External Evidence Bundle Policy

Restricted diagnostic artifacts, old experiment outputs, large raw data, and private audit history should live outside the public repository in a private evidence bundle.

That bundle may be used for governance review, but it should not be linked as public product evidence unless each artifact is reviewed, labeled, and scrubbed for privacy, size, and claim-safety.

## 6. File Size Policy

Public Git-tracked files should remain lightweight:

- Target: individual files below 25 MB.
- Review required: any file above 25 MB.
- Avoid: files above 100 MB.
- Exclude by default: caches, raw GIS downloads, build outputs, dependency folders, archived experiments, and restricted diagnostics.

If a future runtime asset exceeds these limits, document why it is required and consider Git LFS, external hosting, or a smaller derived artifact.
