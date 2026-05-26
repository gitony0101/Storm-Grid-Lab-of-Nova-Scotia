import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { CommunityRisk } from '../engine/communityRiskEngine';
import 'leaflet/dist/leaflet.css';

interface Props {
  communities: CommunityRisk[];
  selectedCommunity?: string | null;
  onSelectCommunity?: (name: string) => void;
}

const HRM_CENTER: [number, number] = [44.65, -63.58];
const HRM_ZOOM = 11;
const DEMO_ANCHORS = new Set(['Bedford', 'Beechville', 'Lower Sackville']);

function HrmMapFocus() {
  const map = useMap();

  useEffect(() => {
    map.setView(HRM_CENTER, HRM_ZOOM, { animate: false });
  }, [map]);

  return null;
}

/** Risk band step-function radius (px) based on risk_score */
function bubbleRadius(score: number): number {
  if (score >= 75) return 22;
  if (score >= 55) return 18;
  if (score >= 35) return 14;
  return 11;
}

/** Risk color for fill */
function communityRiskColor(score: number): string {
  if (score >= 75) return '#dc2626';
  if (score >= 55) return '#f97316';
  if (score >= 35) return '#eab308';
  return '#22c55e';
}

export default function HrmCommunityView({ communities, selectedCommunity, onSelectCommunity }: Props) {
  const topCommunityNames = useMemo(() => {
    return new Set(
      [...communities]
        .sort((a, b) => b.risk_score - a.risk_score || b.outage_count - a.outage_count)
        .slice(0, 3)
        .map((c) => c.community)
    );
  }, [communities]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={HRM_CENTER}
        zoom={HRM_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="rounded-l-lg"
        zoomControl={true}
      >
        <HrmMapFocus />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Data honesty overlay */}
        <div
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
          className="bg-white/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-700 max-w-xs shadow"
        >
          <p className="font-semibold mb-1">StormGrid V7 Triage Engine</p>
          <p className="text-[11px] text-gray-500">
            Community storm-response priority ranking. Bubbles are approximate visual anchors, not official boundaries.
          </p>
        </div>

        {/* Community bubbles */}
        {communities.map((c) => {
          const color = communityRiskColor(c.risk_score);
          const radius = bubbleRadius(c.risk_score);
          const isSelected = selectedCommunity === c.community;
          const shouldShowPermanentLabel =
            isSelected || topCommunityNames.has(c.community) || DEMO_ANCHORS.has(c.community);

          return (
            <CircleMarker
              key={c.community}
              center={[c.lat, c.lon]}
              radius={isSelected ? radius + 5 : radius}
              eventHandlers={{
                click: () => onSelectCommunity?.(c.community),
              }}
              pathOptions={{
                color: isSelected ? '#111827' : '#ffffff',
                fillColor: color,
                fillOpacity: isSelected ? 0.92 : 0.78,
                weight: isSelected ? 5 : 3,
              }}
            >
              <Tooltip
                permanent={shouldShowPermanentLabel}
                direction={shouldShowPermanentLabel ? 'top' : 'auto'}
                opacity={1}
                className={
                  shouldShowPermanentLabel
                    ? '!bg-white !border !border-gray-300 !shadow-sm !px-1.5 !py-0.5 !rounded'
                    : ''
                }
              >
                <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
                  {c.community}
                </div>
              </Tooltip>

              {/* Popup on click */}
              <Popup>
                <div className="min-w-[260px] p-2">
                  <h3 className="font-bold text-base mb-2">{c.community}</h3>

                  {/* Risk band badge */}
                  <span
                    className="text-xs font-bold px-2 py-1 rounded inline-block mb-3"
                    style={{
                      backgroundColor: color,
                      color: c.risk_score >= 35 && c.risk_score < 55 ? '#000' : '#fff',
                    }}
                  >
                    {c.risk_band} {c.risk_score.toFixed(0)}/100
                  </span>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-3">
                    <span className="text-gray-500">Community</span>
                    <span className="text-right font-semibold">{c.community}</span>
                    <span className="text-gray-500">Risk</span>
                    <span className="text-right font-semibold">{c.risk_score.toFixed(1)}/100</span>
                    <span className="text-gray-500">Band</span>
                    <span className="text-right font-semibold">{c.risk_band}</span>
                    <span className="text-gray-500">Confidence</span>
                    <span className="text-right font-semibold">{c.confidence}</span>
                    <span className="text-gray-500">Why V7 ranked this community high</span>
                    <span className="text-right font-semibold">
                      {c.top_drivers.map(d => d.driver).join(', ')}
                    </span>
                    <span className="text-gray-500">Recommended action</span>
                    <span className="text-right font-semibold text-xs">{c.recommended_action}</span>
                    <span className="text-gray-500">Limitation</span>
                    <span className="text-right text-[10px] text-amber-600 italic">
                      StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.
                    </span>
                  </div>

                  {/* Detailed drivers */}
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">
                      Transparent Risk Drivers
                    </p>
                    {c.top_drivers.map((d, i) => (
                      <p key={i} className="text-xs text-gray-700 leading-snug">
                        {d.driver} ({d.contribution})
                        {d.group && (
                          <span className="text-[9px] text-gray-400 ml-1">
                            [{d.group === 'current_storm_pressure' ? 'storm' : d.group === 'community_vulnerability' ? 'vuln' : d.group === 'calibrated_historical_signal' ? 'calibration' : d.group === 'interaction_effects' ? 'interaction' : d.group}]
                          </span>
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Limitation disclaimer */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[9px] text-gray-500 leading-tight">
                      StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time. Community centroid proxy, not official polygon boundary.
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
