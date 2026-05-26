export type DeploymentRecommendation = {
  rank: number;
  site_name: string;
  site_id: string;
  site_type: string;
  lat: number;
  lon: number;
  covered_zones: Array<{
    zone_id: string;
    zone_name: string;
    distance_km: number;
    weighted_risk: number;
  }>;
  covered_risk_score: number;
  candidate_score: number;
  primary_reason: string;
  recommended_action: string;
  evidence: {
    critical_facilities_covered: number;
    population_or_building_coverage: number;
    road_access_score: number;
    flood_safe_location_score: number;
  };
  limitations: string;
};

export type ScenarioDeploymentRecommendations = Record<
  string,
  {
    scenario_label: string;
    recommendations: DeploymentRecommendation[];
  }
>;

export async function loadDeploymentRecommendations(): Promise<ScenarioDeploymentRecommendations> {
  const response = await fetch('/data/deployment_recommendations_by_scenario.json');
  if (!response.ok) {
    throw new Error(`Unable to load deployment recommendations: ${response.status}`);
  }
  return response.json();
}

export function getTopDeploymentRecommendations(
  recommendations: ScenarioDeploymentRecommendations | null,
  scenarioId: string | null
): DeploymentRecommendation[] {
  if (!recommendations || !scenarioId || !recommendations[scenarioId]) {
    return [];
  }
  return recommendations[scenarioId].recommendations.slice(0, 3);
}
