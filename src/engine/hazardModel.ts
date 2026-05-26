/**
 * Hazard support for StormGrid V7 Triage Engine - HRM community level.
 *
 * Converts storm severity inputs into 0-1 normalized hazard sub-scores.
 * Each sub-score is scaled to 0-100 for downstream composition.
 *
 * Inputs:
 *   windSpeed      0-10 (slider or scenario)
 *   rainIntensity  0-10
 *   tideSurge      0-10
 *   stormDuration  optional hours (default null → no duration multiplier)
 *   scenarioId     optional string for scenario-specific overrides
 *
 * Outputs:
 *   wind_score   0-100
 *   rain_score   0-100
 *   tide_score   0-100
 *   hazard_score 0-100 (equal-weight composite)
 */

export interface HazardInputs {
  windSpeed: number;
  rainIntensity: number;
  tideSurge: number;
  stormDuration?: number | null;
  scenarioId?: string;
}

export interface HazardResult {
  wind_score: number;
  rain_score: number;
  tide_score: number;
  hazard_score: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Fiona-style wind cascade: nonlinear amplification at high wind. */
function fionaWindMultiplier(windSpeed: number): number {
  if (windSpeed >= 8) return 1.4;
  if (windSpeed >= 6) return 1.2;
  return 1.0;
}

export function computeHazardScore(input: HazardInputs): HazardResult {
  const { windSpeed, rainIntensity, tideSurge, stormDuration, scenarioId } = input;

  // --- Wind score (0-100) ---
  let windNorm = clamp01(windSpeed / 10);
  let scenarioMult = 1.0;
  if (scenarioId === "fiona-wind-cascade" || scenarioId === "fionaWindCascade") {
    scenarioMult = fionaWindMultiplier(windSpeed);
  }
  const durMult =
    stormDuration != null && stormDuration > 0
      ? clamp01(0.7 + 0.3 * (stormDuration / 48))
      : 1.0;

  const windScore = clamp01(windNorm * scenarioMult * durMult) * 100;

  // --- Rain score (0-100) ---
  const rainNorm = clamp01(rainIntensity / 10);
  const rainScore = rainNorm * 100;

  // --- Tide score (0-100) ---
  const tideNorm = clamp01(tideSurge / 10);
  let tideMult = 1.0;
  if (scenarioId === "high-tide-heavy-rain" || scenarioId === "heavyRainHighTide") {
    tideMult = 1.3;
  }
  const tideScore = clamp01(tideNorm * tideMult) * 100;

  // --- Composite hazard (equal weight) ---
  const hazardScore = (windScore + rainScore + tideScore) / 3;

  return {
    wind_score: Math.round(windScore * 10) / 10,
    rain_score: Math.round(rainScore * 10) / 10,
    tide_score: Math.round(tideScore * 10) / 10,
    hazard_score: Math.round(hazardScore * 10) / 10,
  };
}
