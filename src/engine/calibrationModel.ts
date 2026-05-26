/**
 * Calibration support for StormGrid V7 Triage Engine - HRM community level.
 *
 * Uses historical outage data with Bayesian shrinkage toward a peer-group prior.
 *
 * Formula:
 *   local_weight = n / (n + k)
 *   historical_prior = local_weight * local_outage_rate
 *                    + (1 - local_weight) * similar_community_outage_rate
 *
 * k = 20 (exposed as SHRINKAGE_K constant)
 *
 * Confidence rule:
 *   n >= 30: High
 *   n >= 8:  Medium
 *   else:    Low
 */

export const SHRINKAGE_K = 20;

export interface CalibrationInputs {
  n_outage_events: number;
  community_type: string;
  allCommunities: Array<{
    community: string;
    community_type: string;
    n_outage_events: number;
  }>;
}

export interface CalibrationResult {
  local_outage_rate: number;
  similar_community_outage_rate: number;
  historical_prior: number;
  confidence: "High" | "Medium" | "Low";
  n_outage_events: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeHistoricalPrior(input: CalibrationInputs): CalibrationResult {
  const { n_outage_events, community_type, allCommunities } = input;

  const maxEvents = Math.max(...allCommunities.map(c => c.n_outage_events), 1);

  const localRate = clamp01(n_outage_events / maxEvents);

  const peers = allCommunities.filter(c => c.community_type === community_type);
  const peerCount = peers.length || 1;
  const peerMeanRate = peers.reduce(
    (sum, c) => sum + clamp01(c.n_outage_events / maxEvents), 0
  ) / peerCount;

  const localWeight = n_outage_events / (n_outage_events + SHRINKAGE_K);
  const historicalPrior =
    localWeight * localRate + (1 - localWeight) * peerMeanRate;

  let confidence: "High" | "Medium" | "Low";
  if (n_outage_events >= 30) {
    confidence = "High";
  } else if (n_outage_events >= 8) {
    confidence = "Medium";
  } else {
    confidence = "Low";
  }

  return {
    local_outage_rate: Math.round(localRate * 1000) / 1000,
    similar_community_outage_rate: Math.round(peerMeanRate * 1000) / 1000,
    historical_prior: Math.round(historicalPrior * 1000) / 1000,
    confidence,
    n_outage_events,
  };
}

export function priorToScoreScale(historicalPrior: number): number {
  return clamp01(historicalPrior) * 100;
}
