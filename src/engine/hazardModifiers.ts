/**
 * Community Hazard Modifiers for StormGrid v2.2.0
 *
 * Applies community-specific multiplicative modifiers to each hazard
 * sub-score (wind, rain, tide) before composing the community hazard.
 *
 * Formula:
 *   community_wind  = wind_score  * wind_exposure_modifier
 *   community_rain  = rain_score  * rain_exposure_modifier
 *   community_tide  = tide_score  * tide_exposure_modifier
 *   community_hazard = mean(community_wind, community_rain, community_tide)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-community wind/rain/tide exposure modifiers */
export interface CommunityExposureModifiers {
  [community: string]: {
    wind_exposure_modifier: number;
    rain_exposure_modifier: number;
    tide_exposure_modifier: number;
  };
}

/** Raw JSON shape from community_hazard_modifiers.json */
export interface HazardModifierEntry {
  wind_exposure_modifier: number;
  rain_exposure_modifier: number;
  tide_exposure_modifier: number;
  modifier_source: string;
  modifier_notes: string;
}

export interface HazardModifierManifest {
  model_version: string;
  description: string;
  applied_as: string;
  generated_at: string;
  modifiers: { [community: string]: HazardModifierEntry };
  limitation_text: string;
}

/** Result of applying modifiers to a community's hazard scores */
export interface AdjustedHazardResult {
  community_wind: number;
  community_rain: number;
  community_tide: number;
  community_hazard: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_WIND_MODIFIER = 1.0;
export const DEFAULT_RAIN_MODIFIER = 1.0;
export const DEFAULT_TIDE_MODIFIER = 1.0;

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

let _modifiersCache: CommunityExposureModifiers | null = null;

export async function loadHazardModifiers(
  jsonData?: HazardModifierManifest
): Promise<CommunityExposureModifiers> {
  if (_modifiersCache) return _modifiersCache;

  let manifest: HazardModifierManifest;

  if (jsonData) {
    manifest = jsonData;
  } else {
    const res = await fetch("/data/community_hazard_modifiers.json");
    if (!res.ok) {
      console.warn(
        "community_hazard_modifiers.json not found, using default modifier 1.0 for all communities"
      );
      _modifiersCache = {};
      return _modifiersCache;
    }
    manifest = await res.json();
  }

  const modifiers: CommunityExposureModifiers = {};
  for (const [community, entry] of Object.entries(manifest.modifiers)) {
    modifiers[community] = {
      wind_exposure_modifier: entry.wind_exposure_modifier,
      rain_exposure_modifier: entry.rain_exposure_modifier,
      tide_exposure_modifier: entry.tide_exposure_modifier,
    };
  }

  _modifiersCache = modifiers;
  return modifiers;
}

// ---------------------------------------------------------------------------
// Apply community hazard modifiers
// ---------------------------------------------------------------------------

/**
 * Compute community-adjusted hazard scores.
 *
 * Applies per-community wind/rain/tide exposure modifiers to the base
 * storm hazard sub-scores, then computes the equal-weight composite.
 *
 * @param community - Community name
 * @param wind_score - Base wind score (0-100)
 * @param rain_score - Base rain score (0-100)
 * @param tide_score - Base tide score (0-100)
 * @param modifiers - Loaded community exposure modifiers
 * @returns Adjusted wind/rain/tide scores and composite hazard
 */
export function computeAdjustedHazard(
  community: string,
  wind_score: number,
  rain_score: number,
  tide_score: number,
  modifiers: CommunityExposureModifiers
): AdjustedHazardResult {
  const mod = modifiers[community];
  if (!mod) {
    return {
      community_wind: wind_score,
      community_rain: rain_score,
      community_tide: tide_score,
      community_hazard: (wind_score + rain_score + tide_score) / 3,
    };
  }

  const communityWind = wind_score * mod.wind_exposure_modifier;
  const communityRain = rain_score * mod.rain_exposure_modifier;
  const communityTide = tide_score * mod.tide_exposure_modifier;
  const communityHazard = (communityWind + communityRain + communityTide) / 3;

  return {
    community_wind: Math.round(communityWind * 10) / 10,
    community_rain: Math.round(communityRain * 10) / 10,
    community_tide: Math.round(communityTide * 10) / 10,
    community_hazard: Math.round(communityHazard * 10) / 10,
  };
}
