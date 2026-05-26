# StormGrid: Model Card

## Model Purpose

A weighted linear scoring model that ranks HRM communities by storm response priority. The model combines community hazard, vulnerability proxies, historical outage context, and environmental exposure factors into a single explainable score.

## Intended Use

- Exploratory storm-response planning and priority discussion
- Portfolio demonstration of explainable triage methodology
- Educational reference for transparent weighted scoring under sparse data

## Out-of-Scope Use

StormGrid is not designed for:

- Household, pole, feeder, or restoration-time prediction
- Live emergency dispatch or operational deployment
- Official government, utility, or municipal decision-making
- Probability or likelihood estimation of any kind

## Inputs

| Input | Source |
|---|---|
| Wind speed (scenario) | User-selected storm scenario |
| Rain intensity (scenario) | User-selected storm scenario |
| Storm surge (scenario) | User-selected storm scenario |
| Community vulnerability features | Public data sources and derived proxies |
| Historical outage prior | Public NS Power outage history (2019–2025) |
| Storm duration (scenario) | User-selected storm scenario |

Community vulnerability features are a mix of public data (census, OpenStreetMap) and heuristic proxy values where direct measurements were not available.

## Formula Summary

```
risk_score = clamp(
  community_hazard * 0.40 +
  vulnerability * 0.25 +
  historical_prior * 0.20 +
  wind_tree * 0.10 +
  rain_lowland * 0.05
)
```

Scores are normalized to [0, 100]. The hazard component applies community-specific modifiers (wind, rain, tide) that differentiate communities within the same storm scenario.

## Default Weights

| Component | Weight |
|---|---|
| Community hazard | 0.40 |
| Vulnerability | 0.25 |
| Historical prior | 0.20 |
| Wind/tree exposure | 0.10 |
| Rain/lowland exposure | 0.05 |

Six alternative weight profiles are available in `public/data/model_weight_profiles.json`.

## Risk Bands

| Band | Score Range | Visual |
|---|---|---|
| High priority | ≥ 66 | Red |
| Medium priority | 33–65 | Yellow |
| Lower priority | < 33 | Green |

Bands are heuristic thresholds, not statistically derived.

## Confidence

Confidence is expressed qualitatively based on data quality per community. Communities with feature values marked as proxy or seed estimates receive a lower confidence label. No confidence interval or probabilistic calibration is provided.

## Limitations

- Community locations are centroid proxies, not official boundary polygons
- Vulnerability features include heuristic proxy values
- Storm scenario parameters are hypothetical, not meteorological forecasts
- Validation is replay-based and ranking-oriented — not proof of future outcomes
- Tide sensitivity is zero under uniform storm-level perturbation (community-level surge exposure data is needed)
- Scores are priority rankings, not probabilities

## Human Review Boundary

StormGrid output should always be reviewed by a domain-aware human before any operational use. The tool provides a structured starting point for triage discussions, not a final decision.