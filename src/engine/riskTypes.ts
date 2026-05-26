export type Zone = {
  id: string;
  name: string;
  district: string;
  coordinates: [number, number]; // [lat, lng]
  base: {
    floodExposure: number;
    windExposure: number;
    elevationRisk: number;
    powerVulnerability: number;
    roadAccessRisk: number;
    shelterDistance: number;
    populationExposure: number;
  };
};

export type StormInput = {
  rainIntensity: number;   // 0-10
  windSpeed: number;       // 0-10
  tideSurge: number;      // 0-10
  crowdPressure: number;   // 0-10
};

export type RiskDriver = 'water' | 'air' | 'earth' | 'fire' | 'cascade';

export type ZoneRiskResult = {
  zoneId: string;
  zoneName: string;
  waterRisk: number;
  airRisk: number;
  earthRisk: number;
  fireRisk: number;
  cascadeRisk: number;
  totalRisk: number;
  priorityRank: number;
  dominantRisk: RiskDriver;
  recommendedAction: string;
  explanation: string[];
};

export type DemoScenario = {
  label: string;
  rainIntensity: number;
  windSpeed: number;
  tideSurge: number;
  crowdPressure: number;
};