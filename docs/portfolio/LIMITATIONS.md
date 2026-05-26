# StormGrid Limitations

## Core Limitations

StormGrid is a prototype for community storm response triage. Its outputs are planning context, not automated decisions.

## Community Centroid Proxy

Many community locations are represented by centroid or visual-anchor proxies. This is useful for a map demo but weaker than official polygon-level spatial joins.

## Not an Official Boundary Model

The project should not be described as using official community boundaries unless a specific file has verified source geometry and lineage. HRM community features currently declare centroid proxy limitations.

## Seed Proxy Values

Several vulnerability fields are seeded or heuristic proxies:

- Tree exposure.
- Lowland exposure.
- Rural-line proxy.
- Coastal exposure.
- Critical-access score.
- Urban-load proxy.

These are useful for demo logic but should be replaced with measured GIS features where possible.

## Scenario Approximation

Replay scenarios are plausible storm profiles, not exact historical meteorological reconstructions. Scenario outputs should be interpreted as stress tests for ranking behavior.

## Same-Source Bias

Historical calibration and some evaluation labels share outage-history lineage. This can make metrics look more or less aligned for reasons unrelated to independent validation.

## Small Sample Size

The HRM replay matrix uses 15 communities and 5 scenario events. That is enough for QA and a transparent demo, but not enough for strong external validation.

## Top-K Evidence Limits

Top-K, NDCG, and Spearman metrics are ranking diagnostics. They are useful for comparing rank order under known labels, but they do not establish future storm performance.

## No Fine-Grained Forecasting

StormGrid does not estimate household impacts, pole failures, feeder failures, service restoration timing, or probability-style outage outcomes.

## Not an Operational Emergency System

StormGrid is not an official emergency-management platform. It should not be used for automated deployment, resource allocation, or public safety decisions without independent data, review, and governance.

## Advanced ML Diagnostic Only

Advanced ML challengers, including TabPFN and V7B experiments, were explored offline. They are useful for learning and governance, but they were not promoted to the production demo because the available labels and data lineage did not support stronger claims.

## Public Repo Cleanup Risk

The repository still contains large local artifacts, old experiment outputs, restricted CSVs, and archived candidate files. These should be cleaned or clearly separated before public portfolio release.
