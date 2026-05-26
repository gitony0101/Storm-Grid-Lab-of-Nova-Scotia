export default function Legend() {
  const items = [
    { color: '#22C55E', label: 'LOW', range: '0–35%' },
    { color: '#EAB308', label: 'MODERATE', range: '35–55%' },
    { color: '#F97316', label: 'HIGH', range: '55–75%' },
    { color: '#EF4444', label: 'CRITICAL', range: '75–100%' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg border border-gray-200 px-3 py-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Risk Level</p>
      <div className="flex gap-3">
        {items.map(({ color, label, range }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <div className="leading-tight">
              <span className="text-[10px] font-bold text-gray-700 block">{label}</span>
              <span className="text-[9px] text-gray-400">{range}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}