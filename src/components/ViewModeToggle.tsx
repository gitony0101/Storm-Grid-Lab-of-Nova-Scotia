
interface ToggleProps {
  viewMode: 'ns' | 'county' | 'action';
  setViewMode: (mode: 'ns' | 'county' | 'action') => void;
}

export default function ViewModeToggle({ viewMode, setViewMode }: ToggleProps) {
  return (
    <div className="flex space-x-2 mb-2">
      <button
        onClick={() => setViewMode('ns')}
        className={`px-3 py-1 text-xs rounded ${viewMode === 'ns' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        NS Overview
      </button>
      <button
        onClick={() => setViewMode('county')}
        className={`px-3 py-1 text-xs rounded ${viewMode === 'county' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        County Drill-down
      </button>
      <button
        onClick={() => setViewMode('action')}
        className={`px-3 py-1 text-xs rounded ${viewMode === 'action' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        Action Plan
      </button>
    </div>
  );
}
