import type { RiskDriver } from '../engine/riskTypes';

interface MetricCardProps {
  driver: RiskDriver;
  label: string;
  icon: string;
  color: string;
  avgValue: number;
}

const borderColors: Record<RiskDriver, string> = {
  water: '#3B82F6',
  air: '#A78BFA',
  earth: '#92400E',
  fire: '#EF4444',
  cascade: '#F97316',
};

export default function MetricCard({ driver, label, icon, color, avgValue }: MetricCardProps) {
  const pct = Math.round(avgValue * 100);

  return (
    <div
      className="flex-1 min-w-0 border-t-4 rounded-b-lg bg-white shadow p-3"
      style={{ borderTopColor: borderColors[driver] }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900">{pct}%</div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}