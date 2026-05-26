# StormGrid Project Case Study

## Project One-Liner

StormGrid ranks communities for storm response priority under sparse data using an explainable, auditable scoring model.

## Problem

Storm response planning often starts with incomplete information: uneven public outage history, approximate community geography, limited weather detail, and no direct access to utility operations data. The product challenge was to turn those weak signals into a useful triage view without pretending the data could support fine-grained forecasting.

The core question was:

```text
Given a storm scenario, which communities should a response planner inspect first?
```

## Target User: Maya

Maya is a municipal resilience or emergency-planning analyst preparing for a severe storm briefing. She does not need a black-box forecast. She needs a defensible shortlist, a reason for each priority, confidence caveats, and a way to explain why the ranking changes under wind, rain, and coastal surge scenarios.

Maya's workflow:

1. Select a storm scenario.
2. Review the top priority communities.
3. Inspect drivers such as current storm pressure, vulnerability proxies, historical calibration context, and interaction terms.
4. Use the output as planning context, not as an operational command.

## Hackathon Context

StormGrid was built as a rapid prototype under hackathon-style constraints:

- Short timeline.
- Sparse public data.
- Need for a working demo, not a research-grade deployment.
- High need for transparent claims and auditability.
- Limited ability to validate with independent storm-event ground truth.

Those constraints shaped the model choice. The final demo retained a transparent weighted model because it was easier to inspect, explain, and govern than an advanced ML challenger trained on weak labels.

## Constraints

- Community geometry is a centroid proxy unless official polygons are integrated.
- Vulnerability values include seed and derived proxy features.
- Storm replay inputs are scenario approximations.
- Some labels and historical priors share lineage, creating same-source bias.
- The sample size is small for HRM replay evidence.
- Advanced ML experiments were offline diagnostics only.
- No source code, public data, or production formula changes were made during the portfolio reconciliation.

## Solution

StormGrid combines a React + TypeScript interface with a transparent weighted risk-priority engine:

- The HRM Communities view computes community scores live through `communityRiskEngine.ts`.
- The Halifax Action View connects priority rankings to demo-ready action recommendations.
- Model weights are loaded from `model_weight_profiles.json`.
- Community profile mappings are loaded from `community_model_profiles.json`.
- Public JSON files provide features, scenarios, replay evidence, validation summaries, and diagnostic layers.

The result is a triage dashboard that surfaces ranked communities, priority bands, confidence, drivers, and limitations.

## Demo Flow

1. Start on the StormGrid command view.
2. Select a storm preset or adjust wind, rain, and tide inputs.
3. Inspect the Nova Scotia diagnostic overview for broad context.
4. Select HRM/Halifax to enter the richer HRM community view.
5. Review the top communities and driver explanations.
6. Open the action panel for scenario-specific deploy-first recommendations.
7. Explain that the output is relative response priority evidence, not a utility forecast.

## Technical Approach

The active HRM scoring formula is:

```text
risk =
  w_community_hazard * adjusted_community_hazard
  + w_vulnerability * vulnerability_score
  + w_historical_prior * historical_prior_score
  + w_wind_tree * wind_tree_interaction
  + w_rain_lowland * rain_lowland_interaction
```

The default baseline profile is:

| Component | Weight |
| --- | ---: |
| community_hazard | 0.40 |
| vulnerability | 0.25 |
| historical_prior | 0.20 |
| wind_tree | 0.10 |
| rain_lowland | 0.05 |

The engine also supports named profile variants for community contexts such as urban load, tree-suburban, coastal, lowland, and rural-line communities.

## Model Evolution

StormGrid evolved through several layers:

- Early zone-level logic in `riskEngine.ts`, now legacy for the active HRM path.
- HRM community scoring in `communityRiskEngine.ts`.
- Hazard, vulnerability, calibration, and interaction components.
- Weight profile governance through JSON configuration.
- Replay and validation artifacts for ranking diagnostics.
- Advanced ML challengers explored offline and excluded from final production claims.

The project moved away from opaque challenger claims and toward a governed transparent model because the available labels could not support stronger claims.

## What Went Wrong

Several things surfaced during audit:

- A stale documentation note suggested a different effective weight tuple than the active source supported.
- Some advanced ML artifacts used synthetic, circular, or same-source signals and could be misread if presented without context.
- A V4 TabPFN retry produced no successful fit metric and was not eligible for ranking claims.
- V7B achieved a high diagnostic NDCG value, but the run itself warned that static community structure dominated and no production promotion was justified.
- Public data still contains restricted or superseded artifacts that should be cleaned before a public portfolio release.

## What Was Learned

The main learning was governance discipline:

- A transparent model can be the stronger engineering choice when data is sparse.
- Validation must match the claim being made.
- Advanced ML can be valuable as a challenger, but only if the labels and splits support the interpretation.
- Documentation should distinguish active source of truth, archived candidates, diagnostic outputs, and invalid artifacts.
- Negative results are useful when they prevent overclaiming.

## Final Safe Positioning

StormGrid is a community storm response triage and priority ranking prototype. It uses public and proxy data to support planning-oriented prioritization under uncertainty. It is not a utility operations platform, not a fine-grained asset model, and not an official emergency workflow.

## Impact

The project demonstrates:

- Explainable community prioritization under weak data.
- A practical React + TypeScript demo tied to auditable model logic.
- Clear data lineage and model governance.
- Honest handling of failed or excluded ML experiments.
- A portfolio-ready example of shipping a usable prototype without overstating evidence.

## Future Work

- Replace centroid proxies with official community boundary joins.
- Add independent storm-event labels from a second source.
- Replace seed vulnerability values with measured GIS features where possible.
- Move restricted artifacts out of public data paths.
- Add a clean public README based on the portfolio-safe positioning.
- Rerun build and QA after cleanup.
