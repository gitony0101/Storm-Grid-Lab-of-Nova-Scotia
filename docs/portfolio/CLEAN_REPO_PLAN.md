# StormGrid Clean Repo Plan

This is a future cleanup plan only. No cleanup was executed during the documentation reconciliation.

## Keep

Keep active source-of-truth files:

- `src/app/App.tsx`
- `src/components/HrmCommunityView.tsx`
- `src/components/HrmCommunityTopPanel.tsx`
- `src/components/DeploymentPanel.tsx`
- `src/engine/communityRiskEngine.ts`
- `src/engine/modelWeights.ts`
- `src/engine/hazardModel.ts`
- `src/engine/vulnerabilityModel.ts`
- `src/engine/calibrationModel.ts`
- `src/engine/hazardModifiers.ts`
- `public/data/model_weight_profiles.json`
- `public/data/community_model_profiles.json`
- Active HRM feature and replay files with limitations preserved
- Portfolio docs under `docs/portfolio/`
- Reconciled audit report under `audits/stormgrid_reconciled_audit_20260525/`

## Archive

Archive with clear labels:

- Historical audit reports.
- Phase 5 candidate weight files.
- Submission materials.
- Diagnostic experiment summaries.
- Advanced ML experiment reports.
- `experiments/stormgrid_v4_tabpfn_retry_20260523`
- V7B experiment outputs.
- Old source-pack material.

Archived files should remain accessible for governance history, but not appear as active production evidence.

## Exclude

Exclude from a public portfolio repo unless explicitly needed and documented:

- `node_modules` (about 130M locally).
- `dist` (about 1.5G locally).
- `.venv-stormgrid-advanced-ml` (about 1.4G locally).
- Other `.venv*` folders.
- `public/data/source_cache` (about 391M locally).
- Large generated GIS files.
- Private logs.
- Local `.DS_Store` files.
- Temporary automation outputs.
- Raw private review notes or scratch files.

## Needs Review

Review before keep/archive/exclude:

- `public/data/archive`
- `public/data/ns_community_storm_training.csv`
- `public/data/community_storm_training.csv`
- `public/data/ns_tabpfn_benchmark_results.json`
- Old `ns_ml3`, `ns_ml5`, and `ns_ml6` outputs.
- Old `ns_ml` scripts.
- `src/engine/riskEngine.ts` dead code.
- `src/data/outageFetcher.ts` stale comments.
- `README.md`
- `docs/dataset_recipes.md`
- Any report that repeats the stale 0.50/0.30/0.10/0.07/0.03 weight tuple.
- Large data files under `public/data`.
- Private or machine-specific logs.
- Private review transcripts.

## Specific Cleanup Actions

1. Confirm all current changes are documentation-only.
2. Add or update `.gitignore` for local build artifacts, virtual environments, caches, and source-cache data.
3. Move restricted artifacts to a clearly labeled archive path or remove them from public tracking in a dedicated cleanup branch.
4. Replace stale weight-conflict text with the reconciled verdict.
5. Mark `riskEngine.ts` as legacy or remove it after confirming no import path depends on it.
6. Separate submission materials from source code.
7. Keep only portfolio-safe docs in the main public docs path.
8. Run a credential scan.
9. Run a forbidden-claims scan.
10. Run build verification after cleanup.
11. Run read-only formula parity after cleanup.
12. Create a final public README using portfolio-safe copy.

## Credential Hygiene

Before public release, scan for:

- Credentials.
- Private URLs.
- Local user paths.
- Email addresses not meant for public release.
- Private logs.
- Review transcripts containing private context.

## Build Verification

After cleanup, run:

```bash
npm run build
python scripts/numerical_parity_check.py
```

Only run additional QA scripts after confirming they do not write to tracked source or data files, or after redirecting their outputs to a temporary ignored path.
