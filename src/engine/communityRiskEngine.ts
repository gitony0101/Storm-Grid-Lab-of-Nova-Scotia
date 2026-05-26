/**
 * HRM Community Risk Engine v2.1.0
 *
 * Three-layer model: Hazard x Vulnerability x Calibration
 * Final weights are loaded dynamically via modelWeights.ts (profile-based, configurable).
 * v2.1.0 adds community-specific hazard modifiers applied as:
 *   adjusted_hazard = community_hazard * hazard_modifier
 * The 5-component formula structure is unchanged; only the community_hazard
 * subcomponent entering the weighted sum is adjusted.
 *
 * Clamps to 0-100. Risk bands compatible with existing UI.
 */

import type { StormInput as StormInputs } from "./riskTypes";
import { computeHazardScore, type HazardInputs } from "./hazardModel";
import { computeVulnerabilityScore, type VulnerabilityInputs } from "./vulnerabilityModel";
import {
  computeHistoricalPrior,
  priorToScoreScale,
  type CalibrationInputs,
  type CalibrationResult,
} from "./calibrationModel";
import { type RiskWeights, getCommunityProfile, getProfileWeights, blendWeights } from "./modelWeights";
import { loadHazardModifiers, computeAdjustedHazard } from "./hazardModifiers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityFeatureRecord {
  community: string;
  lat: number;
  lon: number;
  community_type: string;
  coastal_flag: boolean;
  urban_flag: boolean;
  tree_exposure: number;
  lowland_exposure: number;
  rural_line_proxy: number;
  coastal_exposure: number;
  critical_access_score: number;
  n_outage_events: number;
}

export interface CommunityRiskResult {
  community: string;
  lat: number;
  lon: number;
  community_type: string;
  coastal_flag: boolean;
  urban_flag: boolean;
  // Hazard layer
  wind_score: number;
  rain_score: number;
  tide_score: number;
  hazard_score: number;
  adjusted_hazard_score: number;  // v2.2.0: community_hazard after wind/rain/tide modifiers
  community_wind: number;         // v2.2.0: wind_score * wind_exposure_modifier
  community_rain: number;         // v2.2.0: rain_score * rain_exposure_modifier
  community_tide: number;         // v2.2.0: tide_score * tide_exposure_modifier
  hazard_modifier_applied: string; // v2.2.0: "wind_mod,rain_mod,tide_mod"
  // Vulnerability layer
  vulnerability_score: number;
  // Calibration layer
  historical_prior_score: number; // 0-100 scale
  calibration: CalibrationResult;
  // Interaction terms
  wind_tree_interaction: number;
  rain_lowland_interaction: number;
  // Final
  risk_score: number;
  risk_band: string;
  confidence: string;
  limitation: string;
  // Legacy fields for UI compatibility
  outage_count: number;
  max_customers_affected: number;
  avg_customers_affected: number;
  historical_outage_score: number; // kept for reference
  top_drivers: Array<{ driver: string; contribution: number; group?: string }>;
  recommended_action: string;
  n_outage_events: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function riskBand(score: number): string {
  if (score >= 75) return "Critical";
  if (score >= 55) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
}

function recommendedAction(band: string): string {
  switch (band) {
    case "Critical":
      return "Pre-position resources. High monitoring priority. Prepare for immediate deployment.";
    case "High":
      return "Increase monitoring. Stage resources. Prepare community response plans.";
    case "Moderate":
      return "Standard monitoring. Review preparedness plans.";
    default:
      return "Routine monitoring. Standard preparedness posture.";
  }
}

function topDriversFor(
  weights: RiskWeights,
  hazard_score: number,
  vulnerability_score: number,
  hpScore: number,
  wti: number,
  rli: number
): Array<{ driver: string; contribution: number; group: string }> {
  const drivers: { driver: string; contribution: number; group: string }[] = [
    { driver: "Storm pressure", contribution: Math.round(hazard_score * weights.community_hazard) / 100, group: "current_storm_pressure" },
    { driver: "Vulnerability factors", contribution: Math.round(vulnerability_score * weights.vulnerability) / 100, group: "community_vulnerability" },
    { driver: "Historical calibration context", contribution: Math.round(hpScore * weights.historical_prior) / 100, group: "calibrated_historical_signal" },
  ];
  if (wti > 0) drivers.push({ driver: "Wind-tree interaction", contribution: Math.round(wti * weights.wind_tree) / 100, group: "interaction_effects" });
  if (rli > 0) drivers.push({ driver: "Rain-lowland interaction", contribution: Math.round(rli * weights.rain_lowland) / 100, group: "interaction_effects" });
  return drivers.sort((a, b) => b.contribution - a.contribution);
}

// ---------------------------------------------------------------------------
// Compute risk for a single community
// ---------------------------------------------------------------------------

export async function computeCommunityRisk(
  feature: CommunityFeatureRecord,
  stormInputs: StormInputs,
  scenarioId: string,
  allCommunitiesForCalibration: CommunityFeatureRecord[]
): Promise<CommunityRiskResult> {
  // --- Load weights dynamically from modelWeightProfiles ---
  const profileId = await getCommunityProfile(feature.community);
  const profileWeights = await getProfileWeights(profileId);

  // Blend with local data using shrinkage
  const communityWeights = blendWeights(
    profileWeights,
    {}, // no local overrides
    feature.n_outage_events,
    20
  );

  // --- Load hazard modifiers ---
  const hazardModifiers = await loadHazardModifiers();

  // --- Layer 1: Hazard ---
  const hazardInputs: HazardInputs = {
    windSpeed: stormInputs.windSpeed,
    rainIntensity: stormInputs.rainIntensity,
    tideSurge: stormInputs.tideSurge,
    stormDuration: null,
    scenarioId: scenarioId,
  };
  const hazard = computeHazardScore(hazardInputs);

  // --- v2.2.0: Apply community wind/rain/tide hazard modifiers ---
  const adjusted = computeAdjustedHazard(
    feature.community,
    hazard.wind_score,
    hazard.rain_score,
    hazard.tide_score,
    hazardModifiers
  );
  const modifierApplied = hazardModifiers[feature.community]
    ? `${hazardModifiers[feature.community].wind_exposure_modifier.toFixed(2)},${hazardModifiers[feature.community].rain_exposure_modifier.toFixed(2)},${hazardModifiers[feature.community].tide_exposure_modifier.toFixed(2)}`
    : "1.0,1.0,1.0";

  // --- Layer 2: Vulnerability ---
  const vulnInputs: VulnerabilityInputs = {
    tree_exposure: feature.tree_exposure,
    lowland_exposure: feature.lowland_exposure,
    rural_line_proxy: feature.rural_line_proxy,
    coastal_exposure: feature.coastal_exposure,
    critical_access_score: feature.critical_access_score,
  };
  const vulnScore = computeVulnerabilityScore(vulnInputs);

  // --- Layer 3: Calibration ---
  const calInputs: CalibrationInputs = {
    n_outage_events: feature.n_outage_events,
    community_type: feature.community_type,
    allCommunities: allCommunitiesForCalibration.map(c => ({
      community: c.community,
      community_type: c.community_type,
      n_outage_events: c.n_outage_events,
    })),
  };
  const calibration = computeHistoricalPrior(calInputs);
  const hpScore = priorToScoreScale(calibration.historical_prior);

  // --- Interaction terms ---
  const windTreeInteraction = (hazard.wind_score / 100) * feature.tree_exposure * 100;
  const rainLowlandInteraction = (hazard.rain_score / 100) * feature.lowland_exposure * 100;

  // --- Final weighted risk (using adjusted community_hazard, not raw hazard) ---
  const rawRisk =
    communityWeights.community_hazard * adjusted.community_hazard +
    communityWeights.vulnerability * vulnScore +
    communityWeights.historical_prior * hpScore +
    communityWeights.wind_tree * windTreeInteraction +
    communityWeights.rain_lowland * rainLowlandInteraction;

  const riskScore = clamp(Math.round(rawRisk * 10) / 10, 0, 100);
  const band = riskBand(riskScore);

  // --- Legacy fields for UI compatibility ---
  const histScore = clamp((feature.n_outage_events / Math.max(...allCommunitiesForCalibration.map(c => c.n_outage_events), 1)) * 100, 0, 100);

  return {
    community: feature.community,
    lat: feature.lat,
    lon: feature.lon,
    community_type: feature.community_type,
    coastal_flag: feature.coastal_flag,
    urban_flag: feature.urban_flag,
    hazard_score: hazard.hazard_score,
    adjusted_hazard_score: Math.round(adjusted.community_hazard * 10) / 10,
    community_wind: adjusted.community_wind,
    community_rain: adjusted.community_rain,
    community_tide: adjusted.community_tide,
    hazard_modifier_applied: modifierApplied,
    wind_score: hazard.wind_score,
    rain_score: hazard.rain_score,
    tide_score: hazard.tide_score,
    vulnerability_score: vulnScore,
    historical_prior_score: Math.round(hpScore * 10) / 10,
    calibration,
    wind_tree_interaction: Math.round(windTreeInteraction * 10) / 10,
    rain_lowland_interaction: Math.round(rainLowlandInteraction * 10) / 10,
    risk_score: riskScore,
    risk_band: band,
    confidence: calibration.confidence,
    limitation: "StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.",
    outage_count: feature.n_outage_events,
    max_customers_affected: 0,
    avg_customers_affected: 0,
    historical_outage_score: Math.round(histScore * 10) / 10,
    top_drivers: topDriversFor(communityWeights, adjusted.community_hazard, vulnScore, hpScore, windTreeInteraction, rainLowlandInteraction),
    recommended_action: recommendedAction(band),
    n_outage_events: feature.n_outage_events,
  };
}

// ---------------------------------------------------------------------------
// Batch: adjust all communities for scenario + storm
// ---------------------------------------------------------------------------

export async function adjustAllCommunityRisks(
  features: CommunityFeatureRecord[],
  stormInputs: StormInputs,
  scenarioId: string
): Promise<CommunityRiskResult[]> {
  // Pre-load modifiers once for the batch
  await loadHazardModifiers();
  return Promise.all(features.map((f) => computeCommunityRisk(f, stormInputs, scenarioId, features)));
}

// ---------------------------------------------------------------------------
// Loader for use in React component
// ---------------------------------------------------------------------------

export async function loadCommunityFeatures(): Promise<CommunityFeatureRecord[]> {
  const res = await fetch("/data/hrm_community_features.json");
  const data = await res.json();
  return data.communities as CommunityFeatureRecord[];
}

// Re-export the old interface for backwards compatibility with existing imports
export interface CommunityRisk extends CommunityRiskResult {}
