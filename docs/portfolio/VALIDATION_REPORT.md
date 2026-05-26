# StormGrid Validation Report

## Validation Position

Validation is ranking-oriented replay evidence. It supports a transparent triage prototype and model-governance story. It does not prove future storm outcomes.

## Formula Parity Status

Current status: proven for covered formulas.

`python scripts/numerical_parity_check.py` was inspected and confirmed to be read-only. It was run during the reconciliation and passed 27/27 checks.

Covered by the parity check:

- Default weights match the expected profile.
- Hazard scoring matches TypeScript logic for representative scenarios.
- Vulnerability weights match the TypeScript implementation.
- Calibration normalization uses dynamic max events.
- Historical prior scale is handled on the 0-100 risk scale.
- End-to-end Bedford normal-scenario risk matches expected output.
- Interaction terms are scaled consistently.
- Risk-band thresholds match.
- All five risk subcomponents are 0-100 scaled.

Residual limitation: this is not exhaustive proof for every UI adapter, every archived experiment, or every diagnostic public JSON file.

## Ranking Metrics

`public/data/ranking_metrics.json` is explicitly marked diagnostic-only. It evaluates the active ranking against storm-relative labels that are known to be storm-invariant historical aggregates.

Overall reported values:

| Metric | Mean |
| --- | ---: |
| Top-3 capture rate | 0.00 |
| Top-5 capture rate | 0.20 |
| Precision@3 | 0.00 |
| NDCG@5 | 0.1431 |
| Spearman rank | -0.6364 |
| Separation score | -0.4167 |
| Storms evaluated | 5 |

Interpretation: these values are useful for diagnosing how the triage formula diverges from historical aggregate labels. They should not be sold as model failure or model success in isolation.

## Top-K

Top-K metrics are valid as replay ranking diagnostics only. They answer whether the model's top ranked communities overlap with a label-based top set. Because the current label source is not independent and is storm-invariant, Top-K does not validate future storm behavior.

## NDCG

NDCG is useful for rank-order diagnostics. It should be discussed as ranking evidence, not as a probability or classification metric.

V7B reported `Original recomputed NDCG@10: 0.878778` and `No-prior NDCG@10: 0.710695`, but the run also states it is offline diagnostic evidence only, labels are replay diagnostic, static community structure dominates, and no production promotion is allowed.

## LOSO

`public/data/leave_one_storm_out_metrics.json` says LOSO is diagnostic only and `loso_is_informative: false`.

Important facts:

- Label order is identical across all 5 storms.
- Average rank stability across storms is 0.9725.
- LOSO measures formula stability across scenario inputs, not independent storm generalization.

Safe use: rank-stability diagnostic.

Unsafe use: generalization proof.

## Ablation

`public/data/ablation_metrics.json` is diagnostic-only. It reports strong full-evidence-graph metrics, but the file itself warns that the output is response-priority ranking evidence and that same-source bias and proxy values limit interpretation.

Safe use: component-governance and sensitivity evidence.

Unsafe use: primary validation proof.

## Calibration Bins

`public/data/risk_calibration_bins.json` explicitly says the method is not probability calibration. The bins group replay rows by risk band and compare label statistics.

Key facts:

- Total rows: 75.
- Low count: 21.
- Moderate count: 51.
- High count: 3.
- Critical count: 0.
- Label monotonicity with risk band is false.

Interpretation: score-band diagnostics show how the triage score behaves. They do not calibrate event probabilities.

## Sensitivity

`public/data/model_sensitivity_report.json` is diagnostic-only and states the sensitivity interpretation is small-sample ranking sensitivity only.

Safe use: portfolio discussion of sensitivity and limitations.

Unsafe use: future-impact evidence.

## Valid Ranking Evidence

Valid for portfolio:

- Formula parity passed for covered cases.
- Risk scores are bounded and decomposable.
- Weight profiles are loaded from auditable JSON.
- Replay results provide ranking-oriented diagnostics.
- Sensitivity and ablation reports support an engineering-governance narrative.
- V7B and TabPFN were excluded from production claims where governance failed or metrics were unavailable.

## Diagnostic Only

Diagnostic only:

- Top-K metrics against same-source or storm-invariant labels.
- LOSO rank stability.
- Ablation metrics.
- Calibration bins.
- V7B NDCG values.
- V4 TabPFN retry artifacts.
- NS frontend map points.

## Unsafe Results

Unsafe for portfolio claims:

- Province-wide TabPFN benchmark results in public data.
- `ns_community_storm_training.csv` as validation evidence.
- Random, synthetic, or circular-prior experiment outputs.
- Any metric based on labels that share the same source as the historical calibration term unless clearly described as diagnostic.
- ROC AUC as the primary evidence for this project.

## Validation Summary

StormGrid has enough validation evidence for a transparent response-priority ranking prototype. It does not have enough independent labels or measured storm-event outcomes for stronger predictive claims.
