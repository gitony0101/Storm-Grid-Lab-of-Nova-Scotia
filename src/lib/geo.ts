export function getMarkerRadius(totalRisk: number): number {
  // Base radius 400m, scales up to 700m with risk
  return 400 + totalRisk * 300;
}