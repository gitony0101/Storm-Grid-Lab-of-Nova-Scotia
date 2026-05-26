# StormGrid Lab

StormGrid is a Hack the Elements hackathon project built to rank communities for storm response priority under sparse data.

## Demo Screenshot

![StormGrid demo screenshot](./docs/screenshots/stormgrid-demo.png)

## Hackathon Context

StormGrid was built for **Hack the Elements**, a May 2026 hackathon hosted by ShiftKey Labs.

The challenge asked teams to identify a meaningful real-world problem related to one or more Earth system themes, including water, earth, air, and fire, then research and validate the problem using evidence or data and develop a working prototype, demo, model, simulation, or dashboard.

StormGrid fits the Air, Water, and Earth themes:

| Theme | StormGrid connection |
| --- | --- |
| Air | Wind stress, wind/tree exposure, storm pressure |
| Water | Rainfall stress, coastal surge stress, lowland exposure |
| Earth | Community geography, access constraints, infrastructure vulnerability proxies |

The project was designed as a working prototype for community-level storm response triage. It focuses on product clarity, explainable scoring, and guarded validation under limited public data.

## What StormGrid Does

StormGrid is a community storm response triage and priority ranking prototype. It combines scenario hazard inputs, community vulnerability proxies, historical prior evidence, wind/tree exposure, and rain/lowland exposure into a transparent response-priority score.

The current public demo focuses on HRM community ranking, action review, and an optional Nova Scotia Diagnostic Overview. The HRM path is the active scoring and validation path. The Nova Scotia layer is display-only diagnostic context.

StormGrid is designed to make the scoring logic auditable, explain why a community appears near the top of the list, and show how sparse public and proxy data can support a defensible triage workflow.

## Limitations And What StormGrid Does Not Do

StormGrid output is response priority, not outage probability.

StormGrid is not a household, pole, feeder, restoration-time, government, utility, or emergency-operations system. It is not an official deployment. It should not be used as a dispatch authority or operational decision system without validated source data, governance review, and domain-owner approval.

## Demo Flow

1. Open the Nova Scotia Diagnostic Overview for broad visual context.
2. Switch to HRM Communities to compare ranked communities under a selected storm scenario.
3. Inspect a community risk card to see score drivers, confidence, and limitations.
4. Use Halifax Action View to review triage framing for high-priority communities.
5. Read the model and validation notes to separate active demo evidence from archived diagnostics.

## Architecture Summary

| Layer | Implementation |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Active scoring engine | `src/engine/communityRiskEngine.ts` |
| Weight definitions | `src/engine/modelWeights.ts` and `public/data/model_weight_profiles.json` |
| Runtime data | Lightweight JSON files in `public/data/` |
| Validation scripts | Python scripts for replay checks, ranking diagnostics, and formula parity |
| Diagnostic layers | Nova Scotia overview and archived advanced model experiments are diagnostic only |

The active HRM scoring path computes community response-priority scores in the browser. Advanced model challengers and province-scale layers are documented as diagnostic evidence only unless promoted through the active engine and data contracts.

## Model Summary

The active default profile is:

| Component | Weight |
| --- | ---: |
| Community hazard | 0.40 |
| Vulnerability | 0.25 |
| Historical prior | 0.20 |
| Wind/tree exposure | 0.10 |
| Rain/lowland exposure | 0.05 |

Advanced model challengers were explored offline, but the production demo retained the transparent weighted model for explainability and defensibility. TabPFN experiments were audited and excluded from production claims due to synthetic and circular-prior risks.

## Data And Validation Limitations

| Limitation | Meaning |
| --- | --- |
| Community centroid proxies | Community locations are visual anchors, not official boundary polygons |
| Seed and derived proxy values | Some vulnerability and exposure fields are heuristic or derived |
| Scenario approximations | Storm inputs are stress scenarios, not live emergency data |
| Ranking-oriented validation | Metrics evaluate replay ranking behavior, not future storm outcomes |
| Same-source bias | Some historical context and labels share outage-history lineage |
| Small sample size | HRM replay evidence is suitable for a prototype, not operational validation |

## Data Policy

This repository keeps only lightweight runtime data required to run and understand the demo. Large raw GIS caches, archived experiment outputs, and restricted diagnostic artifacts are excluded from the public repository. See `docs/portfolio/DATA_MANIFEST.md`.

## How To Run Locally

Install dependencies:

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

| Document | Purpose |
| --- | --- |
| `docs/portfolio/PROJECT_CASE_STUDY.md` | Product and technical case study |
| `docs/portfolio/ARCHITECTURE.md` | System architecture and data flow |
| `docs/portfolio/MODEL_CARD.md` | Model purpose, inputs, limitations, and governance |
| `docs/portfolio/DATA_LINEAGE.md` | Data source classification and allowed use |
| `docs/portfolio/VALIDATION_REPORT.md` | Ranking evidence and diagnostic-only results |
| `docs/portfolio/LIMITATIONS.md` | Explicit project boundaries |
| `docs/portfolio/CLEAN_REPO_PLAN.md` | Public repository cleanup policy |
| `docs/portfolio/RESUME_LINKEDIN_COPY.md` | Portfolio and interview positioning |

## Safe Claims

StormGrid can safely be described as:

| Safe claim |
| --- |
| StormGrid ranks communities for storm response priority under sparse data. |
| StormGrid is a community storm response triage and priority ranking prototype. |
| The active demo uses a transparent weighted scoring model. |
| Advanced model challengers were explored offline and treated as diagnostic evidence only. |
| Validation is ranking-oriented replay evidence, not proof of future storm outcomes. |
| The project was built as a Hack the Elements hackathon prototype. |

## Forbidden Claims

Do not describe StormGrid as:

| Forbidden claim |
| --- |
| an outage prediction model |
| a system that predicts outages |
| a system that estimates outage probability |
| a household-level prediction system |
| a pole-level prediction system |
| a feeder-level prediction system |
| a restoration-time prediction system |
| an official HRM, NS, government, utility, or emergency deployment |
| a production emergency system |
| a TabPFN main model implementation |
| a project with best model accuracy claims |

## Hackathon Submission Fit

StormGrid was shaped around the Hack the Elements submission expectations:

| Requirement | StormGrid response |
| --- | --- |
| Researched problem analysis | Storm response triage under sparse public data |
| Working prototype or demo | React/TypeScript dashboard with map, controls, ranking, and action view |
| Public GitHub repository | Clean public portfolio repository with source code and documentation |
| Documentation | Model card, data lineage, validation report, limitations, and case study |
| Presentation and storytelling | Clear workflow from storm scenario to community priority review |
