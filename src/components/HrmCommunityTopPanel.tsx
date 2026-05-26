import type { CommunityRisk } from '../engine/communityRiskEngine';

interface Props {
  communities: CommunityRisk[];
}

/** Risk colour for 0-100 score */
function bandColor(score: number): string {
  if (score >= 75) return '#dc2626';
  if (score >= 55) return '#f97316';
  if (score >= 35) return '#eab308';
  return '#22c55e';
}

/** All communities sorted, but always show Bedford, Beechville, Lower Sackville in a collapsible section */
export default function HrmCommunityTopPanel({ communities }: Props) {
  const sorted = [...communities]
    .sort((a, b) => b.risk_score - a.risk_score || b.outage_count - a.outage_count);

  const top3 = sorted.slice(0, 3);
  const top3Names = new Set(top3.map((c) => c.community));
  const keyCommunities = ['Bedford', 'Beechville', 'Lower Sackville'];
  const remainingKey = sorted.filter(
    (c) => keyCommunities.includes(c.community) && !top3Names.has(c.community)
  );

  /* Risk to colour band for the badge */
  const riskBadge = (score: number, band: string) => (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: bandColor(score), color: score >= 35 && score < 55 ? '#000' : '#fff' }}
    >
      {band} {score.toFixed(0)}/100
    </span>
  );

  const renderCard = (c: CommunityRisk, idx: number, showNum: boolean) => (
    <div
      key={c.community}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm mb-2"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center">
          {showNum && (
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white mr-1.5">
              {idx}
            </div>
          )}
          <h3 className="font-bold text-gray-900 text-sm">{c.community}</h3>
        </div>
        {riskBadge(c.risk_score, c.risk_band)}
      </div>

      <p className="text-[11px] text-gray-600 mb-0.5">
        <span className="font-semibold">Community:</span> {c.community}
      </p>
      <p className="text-[11px] text-gray-600 mb-0.5">
        <span className="font-semibold">Risk:</span> {c.risk_score.toFixed(1)}/100
        {' '}|{' '}
        <span className="font-semibold">Band:</span> {c.risk_band}
      </p>
      <p className="text-[11px] text-gray-500">
        <span className="font-semibold">Confidence:</span> {c.confidence}
      </p>
      <p className="text-[11px] text-gray-600 mb-0.5">
        <span className="font-semibold">Why V7 ranked this community high:</span>{' '}
        {c.top_drivers.map((d) => d.driver).join(', ')}
      </p>
      <p className="text-[11px] text-gray-600 mb-0.5">
        <span className="font-semibold">Recommended action:</span> {c.recommended_action}
      </p>
      <p className="text-[10px] text-amber-600 italic mt-1 border-t border-gray-100 pt-1">
        <span className="font-semibold">Limitation:</span> StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.
      </p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
        TOP 3 COMMUNITIES - RESPONSE PRIORITY
      </h2>
      <p className="text-[10px] text-gray-400 mb-2">
        StormGrid V7 Triage Engine ranks community storm-response priority under sparse data. Transparent risk drivers explain each ranking.
      </p>

      {/* Top 3 cards */}
      {top3.map((c, idx) => renderCard(c, idx + 1, true))}

      {/* Key communities section */}
      {remainingKey.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Key Communities
          </h3>
          {remainingKey.map((c) => renderCard(c, 0, false))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 mt-2">
          Key communities are already represented in the top risk list.
        </p>
      )}
    </div>
  );
}
