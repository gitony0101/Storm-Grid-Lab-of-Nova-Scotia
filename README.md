# StormGrid

StormGrid ranks communities for storm response priority under sparse data.

## What StormGrid Does

StormGrid is a community storm response triage and priority ranking prototype. It combines scenario hazard inputs, community vulnerability proxies, historical prior evidence, wind/tree exposure, and rain/lowland exposure into a transparent response-priority score.

The current demo focuses on HRM community ranking and action review. It is designed to make the scoring logic auditable, explain why a community appears near the top of the list, and show how sparse public and proxy data can support a defensible triage workflow.

## Limitations And What StormGrid Does Not Do

StormGrid output is response priority, not outage probability.

StormGrid is not a household, pole, feeder, restoration-time, government, utility, or emergency-operations system. It is not an official deployment. It should not be used as a dispatch authority or operational decision system without validated source data, governance review, and domain-owner approval.

## Demo Flow

1. Open the HRM Communities view to compare ranked communities under the selected storm scenario.
2. Inspect a community risk card to see score drivers, confidence, and limitations.
3. Use Halifax Action View to review triage framing for the highest-priority communities.
4. Read the model and validation notes to separate production demo evidence from archived diagnostics.

## Architecture Summary

- Frontend: React, TypeScript, and Vite.
- Active scoring engine: `src/engine/communityRiskEngine.ts`.
- Weight definitions: `src/engine/modelWeights.ts` and `public/data/model_weight_profiles.json`.
- Data flow: public JSON files in `public/data/` feed the browser demo.
- Scripts: Python scripts generate and audit static community, scenario, replay, and validation artifacts.
- Experiments: offline diagnostic evidence only; advanced ML challengers are not the active demo path.

## Model Summary

The active default profile is:

| Component | Weight |
| --- | ---: |
| Community hazard | 0.40 |
| Vulnerability | 0.25 |
| Historical prior | 0.20 |
| Wind/tree exposure | 0.10 |
| Rain/lowland exposure | 0.05 |

Advanced ML challengers were explored offline, but the production demo retained the transparent weighted model for explainability and defensibility. TabPFN experiments were audited and excluded from production claims due to synthetic and circular-prior risks.

## Data And Validation Limitations

- Community locations use centroid proxies, not official boundary polygons.
- Some vulnerability and exposure fields are seed or derived proxy values.
- Scenario inputs are approximations, not live emergency data.
- Validation is ranking-oriented replay evidence, not proof of future storm outcomes.
- Top-K and NDCG evidence help evaluate ranking behavior but do not establish operational readiness.
- Same-source bias and small sample size remain material limitations.

## How To Run Locally

Install dependencies only if they are not already present in your local clone:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run the numerical parity check:

```bash
python scripts/numerical_parity_check.py
```

## Portfolio Documentation

- `docs/portfolio/PROJECT_CASE_STUDY.md`
- `docs/portfolio/ARCHITECTURE.md`
- `docs/portfolio/MODEL_CARD.md`
- `docs/portfolio/DATA_LINEAGE.md`
- `docs/portfolio/VALIDATION_REPORT.md`
- `docs/portfolio/LIMITATIONS.md`
- `docs/portfolio/CLEAN_REPO_PLAN.md`
- `docs/portfolio/RESUME_LINKEDIN_COPY.md`

## Safe Claims

- StormGrid ranks communities for storm response priority under sparse data.
- StormGrid is a community storm response triage and priority ranking prototype.
- The active demo uses a transparent weighted scoring model.
- Advanced ML challengers were explored offline and treated as diagnostic evidence only.
- Validation is ranking-oriented replay evidence, not proof of future storm outcomes.

## Forbidden Claims

Do not describe StormGrid as:

- an outage prediction model;
- a system that predicts outages;
- a system that estimates outage probability;
- a household-level prediction, pole-level prediction, feeder-level prediction, or restoration-time prediction system;
- an official HRM deployment, official NS deployment, official deployment, or production emergency system;
- a TabPFN main model implementation; or
- a project with best model accuracy claims.
