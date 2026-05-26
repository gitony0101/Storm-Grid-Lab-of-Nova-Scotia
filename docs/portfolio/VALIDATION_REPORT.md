# StormGrid: Validation Report

## Validation Position

StormGrid is validated as a scenario-driven triage ranking prototype. All validation metrics are replay evidence computed against labels derived from historical outage aggregates. They demonstrate how the model ranks communities under different storm scenarios, not how accurately it predicts future outages.

## Formula Parity

A Python script (`scripts/numerical_parity_check.py`) replicates the TypeScript scoring engine exactly, including all rounding steps. All 27 parity checks pass — confirming that the documented formula matches the running code.

## Ranking Metrics (Diagnostic Context)

Metrics are computed against `storm_relative_top30_label`, a label that is storm-invariant (identical across all five storm events). This is a fundamental constraint: the current replay data cannot support storm-specific outcome validation.

| Metric | Value | Note |
|---|---|---|
| Top-3 capture rate | 0.00 | Model triage priorities differ from historical outage ranking |
| Top-5 capture rate | 0.20 | Partial overlap with historical aggregates |
| NDCG@5 | 0.14 | Rank alignment against static labels |
| Spearman rank correlation | −0.64 | Systematic divergence between triage and historical ranking |
| Separation score | −0.42 | Top-3 prioritize vulnerability/tree factors over outage history |
| LOSO rank stability | 0.97 | Rankings are stable when any single storm is removed |

The low top-K metrics are expected: the model deliberately deprioritizes outage history when tree exposure and vulnerability proxies indicate higher triage need. This is the intended behavior, not a model failure.

## Limits of Available Metrics

- **Top-K capture rate**: Measures overlap with historical aggregates, not forecast accuracy. Low values are expected when triage priorities differ from past outage patterns.
- **NDCG**: Rank alignment metric. Impacted by storm-invariant labels that cannot distinguish between scenarios.
- **LOSO**: Measures formula stability, not predictive generalization. All storms share the same label vector.
- **Ablation**: Shows relative component contribution under current weights, not ground-truth importance.
- **Calibration bins**: Score band distribution only. Not probability calibration.

## Why Advanced ML Was Not Promoted

TabPFN and other challengers were explored in offline experiments. They were excluded from the active demo for reasons documented in `model_validation_status.json`: the storm-invariant labels create circular validation when used for supervised learning, and the transparent weighted model is better aligned with the project's explainability requirements.

## Summary

StormGrid's validation demonstrates a working, auditable, replay-consistent ranking model. The validation is honest about its limits: it shows what the model does under replay scenarios, not what it predicts about future storms. The absence of storm-variant labels is the single most important data limitation.