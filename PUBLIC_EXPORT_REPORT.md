# StormGrid Public Export Report

## 1. Source Branch And Commit

- Source branch: `portfolio-cleanup-stormgrid`
- Source commit: `70e6893`
- Export path: `../stormgrid-public-portfolio-clean`

## 2. Export Strategy

This export was built as a separate repository with fresh history. The evidence repository was not rewritten, cleaned, or deleted.

The export copied only the public application surface, selected public data, selected reproducibility scripts, and portfolio documentation. The app opens on the HRM community view so it uses the public HRM data contract by default.

## 3. Files Included

Included groups:

- Root app files: `README.md`, `package.json`, `package-lock.json`, `index.html`, Vite, TypeScript, Tailwind, PostCSS, and ESLint config files.
- Frontend source: `src/app/`, `src/components/`, `src/data/`, `src/lib/`, `src/styles/index.css`, `src/main.tsx`, and `src/types.ts`.
- Scoring source: `communityRiskEngine.ts`, `modelWeights.ts`, `hazardModel.ts`, `vulnerabilityModel.ts`, `calibrationModel.ts`, `hazardModifiers.ts`, `deploymentEngine.ts`, `riskTypes.ts`, and `explanationEngine.ts`.
- Public data: active HRM feature, replay, model weight, profile, validation, sensitivity, ranking, calibration, deployment, and claim-guardrail JSON files.
- Scripts: `numerical_parity_check.py`, `ml_common.py`, `evaluate_topk_capture.py`, `qa_model_weights.py`, and `build_hrm_storm_replay_matrix.py`.
- Portfolio docs: the eight files under `docs/portfolio/`.
- Release note: `STORMGRID_24H_DEMO_RELEASE_REPORT.md`.

## 4. Files Excluded

Excluded groups:

- Previous `.git/` history.
- `audits/`, `archive/`, `experiments/`, `submission/`, `docs/archive/`, historical review folders, and consolidated historical material.
- Dependency and build folders: `node_modules/`, `dist/`, `.venv*`, caches, logs, and temporary folders.
- Source cache and archived public data folders.
- Restricted diagnostic data: `ns_community_storm_training.csv`, `community_storm_training.csv`, `ns_tabpfn_benchmark_results.json`, and old `ns_ml3*`, `ns_ml5*`, and `ns_ml6*` outputs.
- Raw private review notes, local evidence scratch files, chat-history exports, and machine-specific metadata.

## 5. AI-Related Scan Result

The public source scan found no raw chat-history files, private review transcripts, or automation scratch files.

The only remaining hits were dependency package-name false positives in `package-lock.json` for parser packages. Those are third-party package metadata, not project evidence.

## 6. Forbidden Claim Scan Result

The forbidden-claim scan found remaining hits only in explicit forbidden-claim or blocked-claim sections:

- `README.md` forbidden-claims section.
- `docs/portfolio/MODEL_CARD.md` forbidden-claims section.
- `public/data/stormgrid_claims_guardrails.json` blocked-claims list.

No unsafe positive public claim was left in the exported app or portfolio docs.

## 7. Credential Scan Result

No credential values, local user paths, private email addresses, or environment files were found in the export surface.

The remaining scan hits were dependency package-name false positives in `package-lock.json`.

## 8. Build Result

`npm install` completed successfully. It reported one moderate dependency advisory through npm audit.

`npm run build` passed. Non-blocking Node deprecation warnings were printed during install/build.

After build verification, `node_modules/` and `dist/` were removed from the export directory and remain excluded by `.gitignore`.

## 9. Parity Result

`python scripts/numerical_parity_check.py` passed 27/27.

The check verified the active default weight profile:

- `community_hazard`: 0.40
- `vulnerability`: 0.25
- `historical_prior`: 0.20
- `wind_tree`: 0.10
- `rain_lowland`: 0.05

## 10. Remaining Limitations

- The export is a portfolio prototype, not an operational system.
- Validation is ranking-oriented replay evidence, not proof of future storm outcomes.
- Community geometry uses centroid proxies unless official boundary polygons are integrated.
- Some features remain seed or derived proxies.
- The provincial diagnostic map data was not copied because it was outside the allowed public-data list; the export defaults to the HRM community view.
- No GitHub remote is configured yet.
