import type { DemoScenario } from '../engine/riskTypes';

export const demoScenarios: Record<string, DemoScenario> = {
  normal: {
    label: 'Normal Conditions',
    rainIntensity: 2,
    windSpeed: 2,
    tideSurge: 1,
    crowdPressure: 3,
  },
  heavyRainHighTide: {
    label: 'High Tide + Heavy Rain',
    rainIntensity: 8,
    windSpeed: 5,
    tideSurge: 9,
    crowdPressure: 6,
  },
  fionaWindCascade: {
    label: 'Fiona-style Wind Cascade',
    rainIntensity: 5,
    windSpeed: 9,
    tideSurge: 4,
    crowdPressure: 7,
  },
  worstCascade: {
    label: 'Worst Case Cascade',
    rainIntensity: 9,
    windSpeed: 10,
    tideSurge: 10,
    crowdPressure: 9,
  },
};

export const scenarioKeys = Object.keys(demoScenarios);
