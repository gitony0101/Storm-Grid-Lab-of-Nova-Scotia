import type { ZoneRiskResult, RiskDriver } from '../engine/riskTypes';
import { riskToColor, riskToLabel, riskToBgClass } from '../lib/colorScale';
import { formatPercent } from '../lib/format';
import { getDriverLabel, getDriverColor } from '../engine/explanationEngine';

interface PriorityPanelProps {
  topResults: ZoneRiskResult[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

const driverConfig: { driver: RiskDriver; riskKey: keyof ZoneRiskResult; label: string; short: string; color: string }[] = [
  { driver: 'water', riskKey: 'waterRisk', label: 'Water', short: 'W', color: '#3B82F6' },
  { driver: 'air', riskKey: 'airRisk', label: 'Air', short: 'A', color: '#A78BFA' },
  { driver: 'earth', riskKey: 'earthRisk', label: 'Earth', short: 'E', color: '#92400E' },
  { driver: 'fire', riskKey: 'fireRisk', label: 'Fire', short: 'F', color: '#EF4444' },
  { driver: 'cascade', riskKey: 'cascadeRisk', label: 'Cascade', short: 'C', color: '#F97316' },
];

export default function PriorityPanel({ topResults, selectedZoneId, onSelectZone }: PriorityPanelProps) {
  if (topResults.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        Adjust storm controls to see priority zones.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topResults.map((result, index) => {
        const isSelected = result.zoneId === selectedZoneId;
        const riskColor = riskToColor(result.totalRisk);

        return (
          <button
            key={result.zoneId}
            onClick={() => onSelectZone(result.zoneId)}
            className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
              isSelected
                ? 'border-gray-800 shadow-md bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: riskColor }}
              >
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900 truncate">{result.zoneName}</span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: getDriverColor(result.dominantRisk), color: 'white' }}
                  >
                    {getDriverLabel(result.dominantRisk)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-black" style={{ color: riskColor }}>
                    {formatPercent(result.totalRisk)}
                  </span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${riskToBgClass(result.totalRisk)}`}>
                    {riskToLabel(result.totalRisk)}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-5 gap-1 text-xs">
                  {driverConfig.map(({ riskKey, short, color }) => {
                    const riskVal = result[riskKey] as number;
                    return (
                      <div key={riskKey} className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase">{short}</span>
                        <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${Math.round(riskVal * 100)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-gray-600 leading-tight">{result.recommendedAction}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}