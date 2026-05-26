export interface StormInputs {
  rainIntensity: number;
  windSpeed: number;
  tideSurge: number;
  crowdPressure: number;
}

export interface CountyRisk {
  county: string;
  lat: number;
  lon: number;
  // Core risk fields
  risk_score: number;
  risk_band?: string;
  // Additional aggregated metrics (optional – may be absent in placeholder data)
  outage_count?: number;
  max_customers_affected?: number;
  avg_customers_affected?: number;
  historical_outage_score?: number;
  base_risk_score?: number;
  // Drivers and actions
  top_drivers?: string[];
  recommended_action?: string;
  confidence?: string;
  limitation?: string;
  // Allow extra fields without TypeScript error
  [key: string]: any;
}