export function riskToColor(risk: number): string {
  if (risk < 0.35) return '#22C55E'; // green
  if (risk < 0.55) return '#EAB308'; // yellow
  if (risk < 0.75) return '#F97316'; // orange
  return '#EF4444';                   // red
}

export function riskToColorClass(risk: number): string {
  if (risk < 0.35) return 'bg-green-500';
  if (risk < 0.55) return 'bg-yellow-400';
  if (risk < 0.75) return 'bg-orange-500';
  return 'bg-red-500';
}

export function riskToBorderColor(risk: number): string {
  if (risk < 0.35) return '#16A34A';
  if (risk < 0.55) return '#CA8A04';
  if (risk < 0.75) return '#C2410C';
  return '#B91C1C';
}

export function riskToLabel(risk: number): string {
  if (risk < 0.35) return 'LOW';
  if (risk < 0.55) return 'MODERATE';
  if (risk < 0.75) return 'HIGH';
  return 'CRITICAL';
}

export function riskToBgClass(risk: number): string {
  if (risk < 0.35) return 'bg-green-100 text-green-800';
  if (risk < 0.55) return 'bg-yellow-100 text-yellow-800';
  if (risk < 0.75) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}