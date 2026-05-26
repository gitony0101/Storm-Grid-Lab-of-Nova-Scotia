# StormGrid: Project Case Study

## One-Liner

StormGrid ranks HRM communities for storm response priority using a transparent weighted scoring model and sparse public data.

## Problem

When a storm hits the Halifax Regional Municipality, emergency teams need to decide which communities to reach first. Outage data from Nova Scotia Power is not available at community granularity in real time. Existing tools focus on province-scale weather forecasts, not community-level triage. StormGrid was built to close that gap — a lightweight, explainable tool that turns available public data into a community priority list.

## Target User

Emergency management planners, municipal operations teams, and community response coordinators who need a structured starting point for resource allocation during storm events. The tool is designed for exploratory and planning use, not live dispatch.

## What the Demo Does

The demo presents a ranked list of HRM communities under a selected storm scenario. Each community shows a risk score, decomposed into hazard, vulnerability, historical context, wind/tree exposure, and rain/lowland exposure. Users can:

- Select from five storm scenarios (Coastal Nor'Easter, Post-Tropical Derry, Post-Tropical Fiona, Winter Storm, Hurricane)
- View ranked communities on a map with color-coded priority bands
- Inspect individual community cards for score drivers and confidence notes
- Switch between a Nova Scotia overview (diagnostic context) and the active HRM scoring view
- Review action framing for high-priority communities

## Technical Approach

The scoring engine is a weighted linear model implemented in TypeScript and running entirely in the browser. The model combines five components:

- Community hazard (wind, rain, storm surge) — 40%
- Vulnerability (infrastructure proxies, tree exposure, rural access) — 25%
- Historical prior (recorded outage history) — 20%
- Wind/tree exposure — 10%
- Rain/lowland exposure — 5%

Weights are configurable through six pre-defined profiles. The model is validated against replay data from five historical storm events. All scoring logic, weight definitions, and validation outputs are in the repository. A Python script verifies numerical parity between the TypeScript engine and a reference implementation (27 out of 27 checks pass).

## What Was Learned

Building with sparse public data means accepting proxy features where direct measurements do not exist. Community boundaries are approximated by centroid points; vulnerability features include heuristic values. The validation metrics revealed an honest tension: the model's rankings diverge from historical outage aggregates, which reflects a genuine difference between triage priorities and past outage patterns rather than a model defect.

TabPFN and other advanced model challengers were explored offline. They were not promoted to the active demo because the transparent weighted model is better suited to the project's goal — explainable triage — and because the available replay labels do not support supervised learning (storm-invariant labels produce circular validation).

## Future Work

The most impactful next step is access to storm-specific outage counts per community. Current replay labels are storm-invariant (the same historical aggregate repeats across all five storms), which limits what validation can confirm. With storm-variant labels, the model could be tuned and evaluated against actual per-storm outcomes. Additional improvements include official HRM boundary polygons (replacing centroid proxies), utility-sourced infrastructure data, and physically-causal wind exposure features.