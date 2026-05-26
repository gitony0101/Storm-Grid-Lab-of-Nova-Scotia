/**
 * Model weight profiles and blending engine for StormGrid v2.
 * Loads versioned weight profiles from JSON data and provides
 * normalization, validation, and shrinkage-based blending.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskWeights {
  community_hazard: number;
  vulnerability: number;
  historical_prior: number;
  wind_tree: number;
  rain_lowland: number;
}

export interface CommunityModelProfile {
  profile_id: string;
  local_weight_override_allowed: boolean;
  notes: string;
}

export interface ModelWeightProfiles {
  model_version: string;
  description: string;
  profiles: Record<string, RiskWeights>;
  constraints: {
    historical_prior_max: number;
    community_hazard_min_vs_prior: boolean;
    wind_tree_min_vs_rain: boolean;
  };
  baseline_default_profile: string;
}

export interface CommunityModelProfiles {
  profiles: Record<string, CommunityModelProfile>;
}

// ---------------------------------------------------------------------------
// Weight normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a weight object so all values sum to 1.0.
 * Handles cases where weights would otherwise sum to zero.
 */
export function normalizeWeights(w: Partial<RiskWeights>): RiskWeights {
  const keys: (keyof RiskWeights)[] = [
    "community_hazard",
    "vulnerability",
    "historical_prior",
    "wind_tree",
    "rain_lowland",
  ];

  // Default missing keys to 0
  const vals: RiskWeights = {
    community_hazard: w.community_hazard ?? 0,
    vulnerability: w.vulnerability ?? 0,
    historical_prior: w.historical_prior ?? 0,
    wind_tree: w.wind_tree ?? 0,
    rain_lowland: w.rain_lowland ?? 0,
  };

  const total = keys.reduce((sum, k) => sum + vals[k], 0);

  // If all zero, return equal distribution
  if (total === 0) {
    return {
      community_hazard: 1.0 / 5,
      vulnerability: 1.0 / 5,
      historical_prior: 1.0 / 5,
      wind_tree: 1.0 / 5,
      rain_lowland: 1.0 / 5,
    };
  }

  return {
    community_hazard: vals.community_hazard / total,
    vulnerability: vals.vulnerability / total,
    historical_prior: vals.historical_prior / total,
    wind_tree: vals.wind_tree / total,
    rain_lowland: vals.rain_lowland / total,
  };
}

// ---------------------------------------------------------------------------
// Weight validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a weight object against StormGrid constraints:
 * - All weights must be non-negative
 * - Weights must sum to ~1.0 (within tolerance)
 * - historical_prior must not exceed constraints.historical_prior_max (0.30)
 * - community_hazard should be >= historical_prior (when constraint enabled)
 * - wind_tree should be >= rain_lowland (when constraint enabled)
 */
export function validateWeights(
  w: RiskWeights,
  constraints?: {
    historical_prior_max: number;
    community_hazard_min_vs_prior: boolean;
    wind_tree_min_vs_rain: boolean;
  }
): ValidationResult {
  const errors: string[] = [];
  const c = constraints ?? {
    historical_prior_max: 0.30,
    community_hazard_min_vs_prior: true,
    wind_tree_min_vs_rain: true,
  };

  const keys: (keyof RiskWeights)[] = [
    "community_hazard",
    "vulnerability",
    "historical_prior",
    "wind_tree",
    "rain_lowland",
  ];

  // Non-negative check
  for (const k of keys) {
    if (w[k] < 0) {
      errors.push(`${k} must be non-negative, got ${w[k]}`);
    }
  }

  // Sum check (tolerance of 0.001)
  const total = keys.reduce((sum, k) => sum + w[k], 0);
  if (Math.abs(total - 1.0) > 0.001) {
    errors.push(`Weights must sum to 1.0, got ${total.toFixed(4)}`);
  }

  // historical_prior max constraint
  if (w.historical_prior > c.historical_prior_max) {
    errors.push(
      `historical_prior (${w.historical_prior.toFixed(2)}) exceeds max ${c.historical_prior_max}`
    );
  }

  // community_hazard should be >= historical_prior
  if (c.community_hazard_min_vs_prior && w.community_hazard < w.historical_prior) {
    errors.push(
      `community_hazard (${w.community_hazard.toFixed(2)}) should be >= historical_prior (${w.historical_prior.toFixed(2)})`
    );
  }

  // wind_tree should be >= rain_lowland
  if (c.wind_tree_min_vs_rain && w.wind_tree < w.rain_lowland) {
    errors.push(
      `wind_tree (${w.wind_tree.toFixed(2)}) should be >= rain_lowland (${w.rain_lowland.toFixed(2)})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Profile loading (client-side fetch)
// ---------------------------------------------------------------------------

// Module-level cache to avoid repeated fetches
let _weightProfileCache: ModelWeightProfiles | null = null;
let _communityProfileCache: CommunityModelProfiles | null = null;

/**
 * Loads the weight profile configuration.
 * Caches result after first fetch.
 */
export async function loadWeightProfiles(): Promise<ModelWeightProfiles> {
  if (_weightProfileCache) return _weightProfileCache;

  const res = await fetch("/data/model_weight_profiles.json");
  if (!res.ok) {
    throw new Error(`Failed to load model_weight_profiles.json: ${res.status}`);
  }
  const data: ModelWeightProfiles = await res.json();
  _weightProfileCache = data;
  return data;
}

/**
 * Gets weights for a named profile.
 * Falls back to baseline_default_profile if profile not found.
 */
export async function getProfileWeights(
  profileName: string
): Promise<RiskWeights> {
  const profiles = await loadWeightProfiles();
  const profile = profiles.profiles[profileName];

  if (!profile) {
    console.warn(
      `Profile "${profileName}" not found, falling back to "${profiles.baseline_default_profile}"`
    );
    const fallback = profiles.profiles[profiles.baseline_default_profile];
    if (!fallback) {
      throw new Error(
        `Baseline profile "${profiles.baseline_default_profile}" not found`
      );
    }
    return fallback;
  }

  return profile;
}

/**
 * Loads community-to-profile mapping configuration.
 * Caches result after first fetch.
 */
export async function loadCommunityProfiles(): Promise<CommunityModelProfiles> {
  if (_communityProfileCache) return _communityProfileCache;

  const res = await fetch("/data/community_model_profiles.json");
  if (!res.ok) {
    throw new Error(
      `Failed to load community_model_profiles.json: ${res.status}`
    );
  }
  const data: CommunityModelProfiles = await res.json();
  _communityProfileCache = data;
  return data;
}

/**
 * Returns the profile_id for a community name.
 * Falls back to the baseline_default_profile if community not found.
 */
export async function getCommunityProfile(
  communityName: string
): Promise<string> {
  const communityProfiles = await loadCommunityProfiles();
  const entry = communityProfiles.profiles[communityName];

  if (!entry) {
    const weightProfiles = await loadWeightProfiles();
    console.warn(
      `Community "${communityName}" not mapped, falling back to "${weightProfiles.baseline_default_profile}"`
    );
    return weightProfiles.baseline_default_profile;
  }

  return entry.profile_id;
}

// ---------------------------------------------------------------------------
// Shrinkage-based weight blending
// ---------------------------------------------------------------------------

/**
 * Blends profile weights with local community-specific overrides using
 * empirical Bayes shrinkage.
 *
 * local_reliability = sample_size / (sample_size + shrinkage_k)
 *
 * When sample_size is small (sparse data), the profile dominates.
 * When sample_size is large, local overrides matter more.
 *
 * @param profileWeights - Base profile weights (must sum to 1)
 * @param localOverrides - Community-specific partial overrides (only non-zero keys applied)
 * @param sampleSize - Number of observations for this community (e.g., n_outage_events)
 * @param shrinkageK - Shrinkage constant. Default 20 (half-weight at 20 samples, aggressive blending toward local data).
 * @returns Blended weights, always normalized to sum to 1.
 */
export function blendWeights(
  profileWeights: RiskWeights,
  localOverrides: Partial<RiskWeights>,
  sampleSize: number,
  shrinkageK: number = 20
): RiskWeights {
  // If no overrides provided, return profile weights directly
  const overrideKeys = (Object.keys(localOverrides) as (keyof RiskWeights)[]).filter(
    (k) => localOverrides[k] !== undefined && localOverrides[k] !== 0
  );

  if (overrideKeys.length === 0) {
    return { ...profileWeights };
  }

  // Compute reliability from sample size
  const localReliability = sampleSize / (sampleSize + shrinkageK);

  // Blend: start from profile, perturb toward local overrides
  const blended: RiskWeights = { ...profileWeights };

  for (const key of overrideKeys) {
    const localVal = localOverrides[key]!;
    blended[key] =
      profileWeights[key] * (1 - localReliability) + localVal * localReliability;
  }

  // Re-normalize so weights still sum to 1
  return normalizeWeights(blended);
}

// ---------------------------------------------------------------------------
// Helper: get effective weights for a community (convenience)
// ---------------------------------------------------------------------------

/**
 * Convenience function to get the final blended weights for a community.
 * Loads profile mapping, fetches profile, and applies shrinkage blending.
 *
 * @param communityName - Name of the community
 * @param communityData - Community data including n_outage_events and optional local overrides
 * @param shrinkageK - Shrinkage constant (default 20)
 */
export async function getCommunityWeights(
  communityName: string,
  communityData: {
    n_outage_events: number;
    localOverrides?: Partial<RiskWeights>;
  },
  shrinkageK: number = 20
): Promise<RiskWeights> {
  const profileId = await getCommunityProfile(communityName);
  const profileWeights = await getProfileWeights(profileId);

  const overrides = communityData.localOverrides ?? {};

  return blendWeights(
    profileWeights,
    overrides,
    communityData.n_outage_events,
    shrinkageK
  );
}
