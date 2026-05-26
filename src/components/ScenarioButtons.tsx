import type { StormInput, DemoScenario } from '../engine/riskTypes';

interface ScenarioButtonsProps {
  scenarios: Record<string, DemoScenario>;
  activeScenario: string | null;
  onSelect: (key: string, storm: StormInput) => void;
}

export default function ScenarioButtons({ scenarios, activeScenario, onSelect }: ScenarioButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(scenarios).map(([key, scenario]) => (
        <button
          key={key}
          onClick={() => onSelect(key, scenario)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
            activeScenario === key
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-600'
          }`}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}