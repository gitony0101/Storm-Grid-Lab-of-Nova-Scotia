import type { ZoneRiskResult } from '../engine/riskTypes';
import { formatPercent } from '../lib/format';
import { getDriverLabel, getDriverColor } from '../engine/explanationEngine';
import { riskToColor, riskToLabel, riskToBgClass } from '../lib/colorScale';

interface ZonePopupProps {
  result: ZoneRiskResult | null;
}

const driverConfig: { key: keyof ZoneRiskResult; label: string; icon: string; color: string; dimension: string }[] = [
{ key: 'waterRisk', label: 'Water', icon: '💧', color: '#3B82F6', dimension: 'Hazard' },
   { key: 'airRisk', label: 'Air', icon: '💨', color: '#A78BFA', dimension: 'Hazard' },
   { key: 'earthRisk', label: 'Earth', icon: '🏔', color: '#92400E', dimension: 'Vulnerability + Response Capacity' },
   { key: 'fireRisk', label: 'Fire', icon: '🔥', color: '#EF4444', dimension: 'Vulnerability' },
   { key: 'cascadeRisk', label: 'Cascade', icon: '⚡', color: '#F97316', dimension: 'Compound' },
];

export default function ZonePopup({ result }: ZonePopupProps) {
  if (!result) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-400 text-sm">
        Click a zone on the map to see risk details.
      </div>
    );
  }

  const riskColor = riskToColor(result.totalRisk);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 text-white" style={{ backgroundColor: riskColor }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">{result.zoneName}</h3>
            <p className="text-xs opacity-80 mt-0.5">Priority #{result.priorityRank}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{formatPercent(result.totalRisk)}</div>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${riskToBgClass(result.totalRisk)}`}>
              {riskToLabel(result.totalRisk)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Risk Breakdown</p>
        <div className="space-y-2">
{ driverConfig.map(({ key, label, icon, color, dimension }) => {
            const val = result[key] as number;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
<span className="text-xs font-medium text-gray-600 w-14">{label} <span className="text-[9px] text-gray-500">({dimension})</span></span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(val * 100)}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-800 w-10 text-right">
                  {formatPercent(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dominant Risk</p>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-1 rounded text-white"
            style={{ backgroundColor: getDriverColor(result.dominantRisk) }}
          >
            {getDriverLabel(result.dominantRisk)}
          </span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed font-medium">{result.recommendedAction}</p>
      </div>

      {result.explanation && result.explanation.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Why This Zone?</p>
          <ul className="space-y-1">
            {result.explanation.map((line, i) => (
              <li key={i} className="text-xs text-gray-700 leading-relaxed">• {line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}