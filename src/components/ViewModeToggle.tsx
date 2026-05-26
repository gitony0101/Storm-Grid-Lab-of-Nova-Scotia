
interface ToggleProps {
  viewMode: 'ns' | 'county' | 'action';
  setViewMode: (mode: 'ns' | 'county' | 'action') => void;
}

export default function ViewModeToggle({ viewMode, setViewMode }: ToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setViewMode('ns')}
        className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === 'ns' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        NS Overview
      </button>
      <button
        type="button"
        onClick={() => setViewMode('county')}
        className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === 'county' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        HRM Communities
      </button>
      <button
        type="button"
        onClick={() => setViewMode('action')}
        className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode === 'action' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        Halifax Action View
      </button>
    </div>
  );
}
