export type VisiblePriorityCommunity = {
  community_id: string;
  community_name: string;
  county: string;
  display_priority_band: string;
  dynamic_score: number;
  confidence_band?: string;
};

interface VisiblePriorityCommunitiesPanelProps {
  communities: VisiblePriorityCommunity[];
  onSelectCommunity: (communityId: string) => void;
}

export default function VisiblePriorityCommunitiesPanel({
  communities,
  onSelectCommunity,
}: VisiblePriorityCommunitiesPanelProps) {
  const criticalCount = communities.filter((community) => community.display_priority_band === 'Critical').length;
  const highCount = communities.filter((community) => community.display_priority_band === 'High').length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Visible Priority Communities
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            High / Critical communities in the current map view
          </p>
          <p className="mt-1 text-[10px] text-gray-400">
            Relative triage bands, not outage probabilities
          </p>
        </div>
        <div className="text-right text-[10px] text-gray-500">
          <p>{communities.length} visible</p>
          <p>{criticalCount} Critical</p>
          <p>{highCount} High</p>
        </div>
      </div>

      {communities.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
          No High or Critical communities in the current view.
        </p>
      ) : (
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {communities.map((community) => (
            <button
              key={community.community_id}
              type="button"
              onClick={() => onSelectCommunity(community.community_id)}
              className="w-full rounded border border-gray-200 bg-white p-2 text-left shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{community.community_name}</p>
                  <p className="text-[11px] text-gray-500">{community.county} County</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    community.display_priority_band === 'Critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {community.display_priority_band}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-600">
                <span>Score {community.dynamic_score.toFixed(1)}</span>
                {community.confidence_band && <span>Confidence {community.confidence_band}</span>}
              </div>
              <p className="mt-0.5 text-[10px] text-gray-400">In current view</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
