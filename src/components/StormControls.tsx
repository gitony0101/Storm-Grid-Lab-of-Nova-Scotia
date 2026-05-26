import type { StormInput } from '../engine/riskTypes';

interface StormControlsProps {
  storm: StormInput;
  onChange: (storm: StormInput) => void;
}

const riskControls: { key: keyof StormInput; label: string; icon: string; accentColor: string; help: string }[] = [
  { key: 'rainIntensity', label: 'Rainfall Stress', icon: '🌧', accentColor: '#3B82F6', help: '0 dry/light rain · 5 heavy rain · 10 extreme rainfall/flooding pressure' },
  { key: 'windSpeed', label: 'Wind Stress', icon: '💨', accentColor: '#A78BFA', help: '0 calm · 5 strong damaging wind · 10 Fiona-style extreme wind pressure' },
  { key: 'tideSurge', label: 'Coastal Surge Stress', icon: '🌊', accentColor: '#06B6D4', help: '0 normal tide · 5 high tide/coastal pressure · 10 severe coastal surge pressure' },
];

export default function StormControls({ storm, onChange }: StormControlsProps) {
  const handleChange = (key: keyof StormInput, value: number) => {
    onChange({ ...storm, [key]: value });
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">
        Scenario stress inputs, not probabilities: 0 low stress, 5 severe but manageable stress, 10 extreme stress scenario.
      </p>
      {riskControls.map(({ key, label, icon, accentColor, help }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {icon} {label}
            </span>
            <span className="text-sm font-bold text-gray-800">{storm[key]}/10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={storm[key]}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            style={{ accentColor }}
          />
          <p className="mt-0.5 text-[10px] leading-snug text-gray-500">{help}</p>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-[10px] leading-snug text-amber-700">
          Future response-capacity input: action demand is not an active risk control in this demo because the current V7 data contract does not include live crowd or response-capacity scoring fields.
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-amber-700">
          Current risk controls are rainfall, wind, and coastal surge stress.
        </p>
      </div>
    </div>
  );
}
