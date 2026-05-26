# StormGrid Model Card

## Model Purpose

StormGrid ranks communities for storm response priority under sparse data. It is designed to help a planner inspect which communities may deserve attention first under a selected storm scenario.

## Intended Use

- Community-level triage planning.
- Scenario comparison for wind, rain, tide, and compound storm stress.
- Explainable ranking review using hazard, vulnerability, historical calibration context, and interaction drivers.
- Portfolio demonstration of transparent model governance under limited data.

## Out-of-Scope Use

- Utility operations forecasting.
- Fine-grained infrastructure or household impact estimation.
- Restoration timing.
- Automated dispatch.
- Public safety command decisions without independent verification.
- Any claim that the score is a calibrated probability.

## Input Features

Storm inputs:

- Wind severity on a 0-10 scale.
- Rain severity on a 0-10 scale.
- Tide or surge severity on a 0-10 scale.
- Optional duration in the hazard model.
- Scenario ID for selected scenario adjustments.

Community inputs:

- Community name and centroid.
- Community type.
- Coastal and urban flags.
- Tree exposure proxy.
- Lowland exposure proxy.
- Rural-line proxy.
- Coastal exposure proxy.
- Critical-access score.
- Historical event count for calibration context.

## Proxy Features

The model uses proxy features because high-resolution infrastructure and official operating data are not available:

- `tree_exposure`
- `lowland_exposure`
- `rural_line_proxy`
- `coastal_exposure`
- `critical_access_score`
- `urban_load_proxy`
- Community centroids

These should be replaced or validated with measured GIS features before any serious operational evaluation.

## Scenario Assumptions

Replay inputs represent plausible storm severity profiles. They are not exact historical weather-station measurements. The model is therefore evaluated as a scenario-driven ranking prototype.

## Formula

```text
adjusted_community_hazard =
  mean(
    wind_score * wind_exposure_modifier,
    rain_score * rain_exposure_modifier,
    tide_score * tide_exposure_modifier
  )

vulnerability_score =
  0.30 * tree_exposure
  + 0.20 * lowland_exposure
  + 0.20 * rural_line_proxy
  + 0.15 * coastal_exposure
  + 0.15 * critical_access_score

historical_prior =
  local_weight * local_outage_rate
  + (1 - local_weight) * similar_community_outage_rate

risk_score =
  w1 * adjusted_community_hazard
  + w2 * vulnerability_score
  + w3 * historical_prior_score
  + w4 * wind_tree_interaction
  + w5 * rain_lowland_interaction
```

All final components are on a 0-100 scale before weighted composition.

## Weight Profiles

The baseline default profile is:

| Component | Weight |
| --- | ---: |
| community_hazard | 0.40 |
| vulnerability | 0.25 |
| historical_prior | 0.20 |
| wind_tree | 0.10 |
| rain_lowland | 0.05 |

Profile variants exist for community contexts such as urban load, tree-suburban, coastal, lowland, and rural-line. They are loaded from `public/data/model_weight_profiles.json` and mapped through `public/data/community_model_profiles.json`.

The stale 0.50/0.30/0.10/0.07/0.03 tuple is not an active default profile and was not found in the active TypeScript engine or current weight JSON.

## Risk Bands

| Band | Score range |
| --- | --- |
| Critical | >= 75 |
| High | >= 55 and < 75 |
| Moderate | >= 35 and < 55 |
| Low | < 35 |

For the Nova Scotia diagnostic overview, the UI may compute display-only priority bands for scenario context. Those bands do not mutate the underlying score.

## Confidence

Historical calibration confidence is based on event count:

| Confidence | Rule |
| --- | --- |
| High | `n_outage_events >= 30` |
| Medium | `n_outage_events >= 8` and `< 30` |
| Low | `< 8` |

Confidence reflects data support for the historical calibration term, not certainty about future storm impact.

## Validation Metrics

The current validation package includes:

- Ranking metrics by storm.
- Top-K capture.
- NDCG.
- Spearman rank comparison.
- Leave-one-storm-out diagnostic stability.
- Ablation metrics.
- Calibration-bin diagnostics.
- Sensitivity summaries.
- Formula parity check.

`python scripts/numerical_parity_check.py` passed 27/27 checks during this reconciliation.

## Same-Source Bias

Historical calibration and some replay labels share outage-history lineage. This is acceptable for transparent calibration context, but it limits validation strength. Metrics involving those labels are diagnostic and should not be described as independent proof.

## Known Limitations

- Community centroids are proxy anchors.
- Vulnerability values include seed and derived proxies.
- Replay storms are approximations.
- Sample size is small.
- Labels are not independent enough to support strong forecasting claims.
- Public data contains restricted or superseded experiment artifacts that need cleanup.
- Some metadata needs review, including a future-dated HRM features timestamp.

## Ethical and Operational Limitations

The score may influence attention if misused. Any portfolio or demo use must state that the output is planning context and requires human review, local knowledge, and independent data. The model should not be used to deprioritize vulnerable communities or allocate scarce resources without a formal decision process.

## Future Extension

- Add official boundary polygons.
- Add independent storm-event labels.
- Replace seed proxies with measured features.
- Separate public portfolio data from archived experiments.
- Add explicit provenance metadata to every shipped artifact.
- Re-evaluate advanced ML only after clean labels and split governance exist.

## Forbidden Claims

Required boundary statement:

StormGrid output is response priority, not outage probability.

Do not describe StormGrid as an outage prediction model, say it predicts outages, claim household-level prediction, pole-level prediction, feeder-level prediction, restoration-time prediction, official deployment, production emergency system status, best model accuracy, or call TabPFN main model.
