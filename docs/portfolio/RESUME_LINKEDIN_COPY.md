# StormGrid Resume and LinkedIn Copy

## One-Sentence Resume Bullet

Built StormGrid, an explainable React/TypeScript storm-response triage prototype that ranks communities by response priority using auditable weighted scoring, public/proxy data lineage, and guarded validation.

## Stronger Resume Bullets

- Built a React + TypeScript + Vite triage dashboard with live HRM community ranking, scenario controls, priority bands, confidence labels, and driver-level explanations.
- Designed a transparent weighted scoring engine with JSON-governed weight profiles, formula parity checks, and documented limits for sparse public data.
- Audited and excluded advanced ML challengers when label lineage, synthetic priors, or failed fit metrics made stronger claims indefensible.

## Technical Portfolio Paragraph

StormGrid is a community response-priority ranking prototype built with React, TypeScript, Vite, and static public JSON artifacts. The active HRM model path runs through `communityRiskEngine.ts`, loading weight profiles from `model_weight_profiles.json` and community profile mappings from `community_model_profiles.json`. The scoring engine combines adjusted storm hazard, vulnerability proxies, historical calibration context, and interaction terms into a transparent 0-100 priority score.

## Product Portfolio Paragraph

The product is designed for a planner like Maya, who needs a defensible shortlist before a storm briefing. StormGrid emphasizes explainability: each priority score has drivers, confidence, and limitations. The workflow is intentionally planning-oriented, not automated command-and-control.

## ML Governance Paragraph

The strongest part of the project is governance under weak data. Advanced ML challengers were explored offline, but the final demo retained the transparent weighted model because the available labels had same-source and synthetic-prior risks. TabPFN and V7B outputs are documented as diagnostic evidence only, with no production promotion.

## Architecture Paragraph

StormGrid uses a static-data architecture: public JSON artifacts feed a TypeScript scoring engine and React views. HRM communities are computed live in the browser, while the Nova Scotia overview is a diagnostic precomputed layer. Scripts build replay matrices and validation summaries, but experiments are treated as diagnostic unless promoted through the active engine and data contracts.

## GitHub README Summary

StormGrid ranks communities for storm response priority under sparse data. It uses a transparent weighted model, proxy-aware data lineage, and ranking-oriented validation to support scenario-based triage planning. Advanced ML challengers were audited offline and excluded from final production claims where the evidence was not strong enough.

## LinkedIn Summary

I built StormGrid as a portfolio project in responsible applied ML and product engineering. It turns sparse public storm-response signals into explainable community priority rankings, then documents exactly what the model can and cannot support. The project combines React/TypeScript frontend work, transparent model design, validation audits, and clear claim governance.

## 30-Second Interview Answer

StormGrid is a community storm-response triage prototype. I built a React/TypeScript dashboard and a transparent weighted scoring engine that ranks communities by response priority under different storm scenarios. The hard part was not the formula; it was governance. I audited the data lineage, found that several advanced ML outputs were not defensible, and kept the final demo explainable and claim-safe.

## 60-Second Interview Answer

StormGrid started as a storm response ranking tool under sparse public data. The active path uses `communityRiskEngine.ts`, which combines adjusted storm hazard, vulnerability proxies, historical calibration context, and interaction terms. Weights are loaded from JSON profiles so the model is auditable rather than hardcoded. I also ran a reconciliation audit because two reports disagreed about formula parity and default weights. The repository evidence showed the default profile is 0.40, 0.25, 0.20, 0.10, and 0.05, and the covered TypeScript/Python parity check passed 27/27. The final portfolio framing is honest: this is response-priority ranking, advanced ML was diagnostic only, and validation is replay ranking evidence with clear limitations.

## Forbidden Claims Q&A

### Was StormGrid forecasting outages?

No. StormGrid is a community response-priority ranking prototype. It helps inspect which communities should be reviewed first under sparse data and scenario assumptions.

### Why not use TabPFN as main model?

TabPFN was explored offline, but the repository evidence did not support using it as the final model. The V4 retry had no successful fit metric, and earlier TabPFN artifacts had synthetic or circular-prior risks. The transparent weighted engine was more explainable and defensible for the available data.

### What did you learn from failed experiments?

I learned to treat failed experiments as governance evidence. A challenger can be technically interesting and still be wrong for the product if the labels are weak, circular, or not independently validated.

### What would you improve next?

I would replace centroid and seed proxies with measured GIS features, add independent storm-event labels, clean restricted artifacts out of the public repo, and rerun validation on a cleaner evidence base.
