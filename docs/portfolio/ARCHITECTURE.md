# StormGrid Architecture

## Overview

StormGrid is a React + TypeScript + Vite frontend backed by static public JSON artifacts and a transparent TypeScript scoring engine. The active HRM path computes community response-priority scores in the browser. Province-level files are diagnostic layers and should be described with stronger caveats.

## Frontend Stack

- React for component state and view composition.
- TypeScript for typed model results and component contracts.
- Vite for local development and production build.
- Static JSON under `public/data/` for features, weights, replay outputs, and diagnostic layers.

## Active Views

### HRM Communities View

The HRM Communities view is the richest active model path. It receives live community scores from `communityRiskEngine.ts` through `App.tsx`.

Key files:

- `src/app/App.tsx`
- `src/components/HrmCommunityView.tsx`
- `src/components/HrmCommunityTopPanel.tsx`
- `src/components/StormControls.tsx`
- `src/components/ScenarioButtons.tsx`
- `src/engine/communityRiskEngine.ts`

### Halifax Action View

The action panel uses scenario-specific recommendation payloads and connects community ranking to planning actions. It is a demo workflow for triage planning, not a field dispatch system.

Key files:

- `src/components/DeploymentPanel.tsx`
- `src/engine/deploymentEngine.ts`
- `public/data/deployment_recommendations_by_scenario.json`

### Nova Scotia Diagnostic Overview

The Nova Scotia overview uses precomputed public diagnostic layers from `public/data/ns_frontend_map_points.json`. Its lineage file says it is not proven to be direct final V7 experiment output. It should be positioned as diagnostic context only.

## Active Engine

`src/engine/communityRiskEngine.ts` is the active HRM scoring engine.

Evidence:

- `src/app/App.tsx` imports `adjustAllCommunityRisks`, `loadCommunityFeatures`, and `CommunityRiskResult` from `communityRiskEngine.ts`.
- The app calls `loadCommunityFeatures()`.
- The app calls `adjustAllCommunityRisks(communityFeatures, storm, scenarioKey)`.
- The returned results populate HRM community views and top panels.

`src/engine/riskEngine.ts` is legacy zone logic for the current app path. It has no active `src` import other than stale comments in data code and older documentation references.

## Weights and Profiles

`src/engine/modelWeights.ts` loads weight profiles from:

```text
public/data/model_weight_profiles.json
```

The baseline default profile is:

| Component | Weight |
| --- | ---: |
| community_hazard | 0.40 |
| vulnerability | 0.25 |
| historical_prior | 0.20 |
| wind_tree | 0.10 |
| rain_lowland | 0.05 |

`public/data/community_model_profiles.json` maps communities to named profiles such as:

- `default`
- `urban_load`
- `tree_suburban`
- `coastal`
- `lowland`
- `rural_line`

The engine supports shrinkage-style local override blending, but the active call path passes no local overrides, so the mapped profile weights are returned unchanged.

## Public Data JSON Flow

```text
public/data/hrm_community_features.json
  -> loadCommunityFeatures()
  -> communityRiskEngine.ts

public/data/model_weight_profiles.json
  -> modelWeights.ts
  -> getProfileWeights()

public/data/community_model_profiles.json
  -> modelWeights.ts
  -> getCommunityProfile()

public/data/community_hazard_modifiers.json
  -> hazardModifiers.ts
  -> adjusted community hazard

public/data/deployment_recommendations_by_scenario.json
  -> deploymentEngine.ts
  -> DeploymentPanel

public/data/ns_frontend_map_points.json
  -> NovaScotiaOverview
  -> diagnostic province layer
```

## Scripts Pipeline

The repository contains scripts for building feature tables, replay matrices, QA reports, diagnostic experiments, and validation summaries. Important script roles:

- `scripts/build_hrm_storm_replay_matrix.py`: Python replay matrix builder that mirrors the TypeScript formula, but writes outputs and should not be run in guarded documentation work.
- `scripts/numerical_parity_check.py`: read-only formula parity check; current run passed 27/27.
- `scripts/demo_sanity_check.py`: writes a public data artifact, so it was not run during this documentation-only reconciliation.
- NS expansion scripts: produce larger diagnostic province artifacts and require careful lineage handling.

## Experiments

Experiments are diagnostic only unless explicitly promoted through source-of-truth files. Current portfolio stance:

- V4 TabPFN retry: offline diagnostic, no successful fit metric, not ranked.
- V7B run: diagnostic ablation, not production promoted.
- Final data trust freeze: governance artifact identifying canonical diagnostic tables and quarantined outputs.

## Text Architecture Diagram

```text
User changes storm controls
  -> App state updates storm inputs
  -> App calls adjustAllCommunityRisks()
  -> communityRiskEngine.ts computes per-community scores
       -> hazardModel.ts
       -> vulnerabilityModel.ts
       -> calibrationModel.ts
       -> hazardModifiers.ts
       -> modelWeights.ts
            -> model_weight_profiles.json
            -> community_model_profiles.json
  -> HRM Communities view renders ranked communities
  -> HRM top panel renders priority cards
  -> Action panel renders scenario recommendations

Province overview
  -> ns_frontend_map_points.json
  -> display-only diagnostic layer
  -> separate from active HRM scoring engine
```

## Deployment Boundary

StormGrid is a prototype and portfolio demo. It does not represent municipal adoption, utility adoption, or an official operating workflow.
