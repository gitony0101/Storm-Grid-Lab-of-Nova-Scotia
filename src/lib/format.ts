export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatRisk(value: number): string {
  return (value * 100).toFixed(0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}