import type { ZoneRiskResult, RiskDriver, StormInput } from './riskTypes';

const driverLabels: Record<RiskDriver, string> = {
  water: 'flood and storm surge',
  air: 'wind exposure',
  earth: 'elevation and road access',
  fire: 'power and electrical cascade',
  cascade: 'multi-hazard cascade',
};

const driverShort: Record<RiskDriver, string> = {
  water: 'Water',
  air: 'Air',
  earth: 'Earth',
  fire: 'Fire',
  cascade: 'Cascade',
};

export function generateExplanation(result: ZoneRiskResult, storm: StormInput): string[] {
  const lines: string[] = [];
  const d = result.dominantRisk;

  lines.push(
    `This zone is high priority because ${driverLabels[d]} risk is the dominant driver ` +
    `under the current storm conditions.`
  );

  if (result.waterRisk > 0.5) {
    lines.push(
      `Water risk is elevated (${Math.round(result.waterRisk * 100)}%) — ` +
      `heavy rain (${storm.rainIntensity}/10) and tide surge (${storm.tideSurge}/10) are compounding flood exposure.`
    );
  }
  if (result.airRisk > 0.5) {
    lines.push(
      `Air risk is elevated (${Math.round(result.airRisk * 100)}%) — ` +
      `wind speed of ${storm.windSpeed}/10 is straining exposed structures and population.`
    );
  }
  if (result.fireRisk > 0.5) {
    lines.push(
      `Fire risk is elevated (${Math.round(result.fireRisk * 100)}%) — ` +
      `power vulnerability combined with high wind creates electrical cascade potential.`
    );
  }
  if (result.earthRisk > 0.5) {
    lines.push(
      `Earth risk is elevated (${Math.round(result.earthRisk * 100)}%) — ` +
      `elevation and road access constraints limit evacuation and rescue access.`
    );
  }
  if (result.cascadeRisk > 0.5) {
    lines.push(
      `Cascade risk is critical (${Math.round(result.cascadeRisk * 100)}%) — ` +
      `multiple hazards are overlapping and may trigger secondary failures.`
    );
  }

  lines.push(`Recommended action: ${result.recommendedAction}`);

  return lines;
}

export function getDriverLabel(driver: RiskDriver): string {
  return driverShort[driver];
}

export function getDriverColor(driver: RiskDriver): string {
  const colors: Record<RiskDriver, string> = {
    water: '#3B82F6',
    air: '#A78BFA',
    earth: '#92400E',
    fire: '#EF4444',
    cascade: '#F97316',
  };
  return colors[driver];
}