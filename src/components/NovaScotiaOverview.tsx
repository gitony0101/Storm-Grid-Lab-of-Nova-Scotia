import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { StormInput } from '../engine/riskTypes';
import type { VisiblePriorityCommunity } from './VisiblePriorityCommunitiesPanel';
import 'leaflet/dist/leaflet.css';

const NS_CENTER: [number, number] = [45.1, -63.9];
const NS_ZOOM = 7;
const LIMITATION =
  'StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.';
const DEMO_ANCHORS = new Set([
  'Halifax',
  'Sydney',
  'Truro',
  'New Glasgow',
  'Yarmouth',
  'Annapolis Royal',
  'Valley',
]);

type NsMapPoint = {
  community_id: string;
  community_name: string;
  county: string;
  lat: number;
  lon: number;
  scenario_id: string;
  risk_score: number;
  risk_band: string;
  confidence_band: string;
  review_required: boolean;
  evidence_conflict_level: string;
  priority_band?: string;
  priority_percentile?: number;
};

type DynamicNsMapPoint = NsMapPoint & {
  baseline_score: number;
  dynamic_score: number;
  wind_sensitivity: number;
  rain_sensitivity: number;
  coastal_sensitivity: number;
  display_priority_band: string;
  rank_within_scenario: number;
  percentile_within_scenario: number;
  source_scenarios: string[];
};

type CountySummary = {
  county: string;
  center: [number, number];
  county_priority_score: number;
  max_risk: number;
  average_top5_risk: number;
  high_risk_share: number;
  high_risk_count: number;
  community_count: number;
  highest_risk_community: DynamicNsMapPoint;
};

type NsMapPayload = {
  points: NsMapPoint[];
  limitation_text?: string;
};

interface Props {
  activeScenario: string | null;
  stormInputs: StormInput;
  mode?: 'overview' | 'county';
  selectedCounty?: string | null;
  focusedCommunityId?: string | null;
  onSelectCounty?: (county: string | null) => void;
  onVisiblePriorityCommunitiesChange?: (communities: VisiblePriorityCommunity[]) => void;
}

function NovaScotiaMapFocus() {
  const map = useMap();

  useEffect(() => {
    map.setView(NS_CENTER, NS_ZOOM, { animate: false });
  }, [map]);

  return null;
}

function NovaScotiaMapState({
  onZoomChange,
  onBoundsChange,
}: {
  onZoomChange: (zoom: number) => void;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
    const bounds = map.getBounds();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [map, onBoundsChange, onZoomChange]);

  return null;
}

function CountyFocus({ communities }: { communities: DynamicNsMapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (communities.length === 0) return;
    const coords = communities.map((point) => [point.lat, point.lon] as [number, number]);
    map.fitBounds(coords, { padding: [36, 36], maxZoom: 10 });
  }, [communities, map]);

  return null;
}

function CommunityFocus({
  community,
  onFocused,
}: {
  community: DynamicNsMapPoint | null;
  onFocused: (communityId: string) => void;
}) {
  const map = useMap();
  const lastFocusedCommunityId = useRef<string | null>(null);

  useEffect(() => {
    if (!community) return;
    if (lastFocusedCommunityId.current === community.community_id) return;
    lastFocusedCommunityId.current = community.community_id;
    map.flyTo([community.lat, community.lon], Math.max(map.getZoom(), 10), { duration: 0.45 });
    onFocused(community.community_id);
  }, [community, map, onFocused]);

  return null;
}

function riskColor(score: number): string {
  if (score >= 65) return '#dc2626';
  if (score >= 50) return '#f97316';
  if (score >= 35) return '#eab308';
  return '#22c55e';
}

function markerRadius(score: number): number {
  if (score >= 65) return 9;
  if (score >= 50) return 7;
  if (score >= 35) return 5;
  return 4;
}

function countyRiskBand(score: number): string {
  if (score >= 65) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Low';
}

function displayPriorityBandFor(score: number, index: number, total: number, storm: StormInput): string {
  const percentile = (index + 1) / Math.max(total, 1);
  const scenarioSeverity = Math.max(storm.rainIntensity, storm.windSpeed, storm.tideSurge);

  if (scenarioSeverity < 5) {
    if (score >= 55 && percentile <= 0.20) return 'High';
    if (score >= 35 || percentile <= 0.50) return 'Moderate';
    return 'Low';
  }

  if (scenarioSeverity < 7) {
    if (percentile <= 0.20) return 'High';
    if (percentile <= 0.50) return 'Moderate';
    return 'Low';
  }

  if (percentile <= 0.05) return 'Critical';
  if (percentile <= 0.20) return 'High';
  if (percentile <= 0.50) return 'Moderate';
  return 'Low';
}

function priorityColor(band: string): string {
  if (band === 'Critical') return '#dc2626';
  if (band === 'High') return '#f97316';
  if (band === 'Moderate') return '#eab308';
  return '#22c55e';
}

function pointInBounds(
  point: DynamicNsMapPoint,
  bounds: { north: number; south: number; east: number; west: number } | null
): boolean {
  if (!bounds) return true;
  return point.lat <= bounds.north && point.lat >= bounds.south && point.lon <= bounds.east && point.lon >= bounds.west;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function scoreByScenario(points: NsMapPoint[]): Record<string, NsMapPoint> {
  return points.reduce<Record<string, NsMapPoint>>((acc, point) => {
    acc[point.scenario_id] = point;
    return acc;
  }, {});
}

export default function NovaScotiaOverview({
  activeScenario,
  stormInputs,
  mode = 'overview',
  selectedCounty: selectedCountyProp,
  focusedCommunityId,
  onSelectCounty,
  onVisiblePriorityCommunitiesChange,
}: Props) {
  const [points, setPoints] = useState<NsMapPoint[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [internalSelectedCounty, setInternalSelectedCounty] = useState<string | null>(null);
  const [zoom, setZoom] = useState(NS_ZOOM);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedCounty = selectedCountyProp ?? internalSelectedCounty;
  const setSelectedCounty = (county: string | null) => {
    setInternalSelectedCounty(county);
    onSelectCounty?.(county);
  };
  const activeScenarioLabel = activeScenario == null ? 'Manual storm inputs' : activeScenario.replace(/([A-Z])/g, ' $1').trim();

  useEffect(() => {
    fetch('/data/ns_frontend_map_points.json')
      .then((res) => {
        if (!res.ok) throw new Error(`ns_frontend_map_points.json ${res.status}`);
        return res.json();
      })
      .then((data: NsMapPayload) => {
        setPoints(Array.isArray(data.points) ? data.points : []);
        setLoadError(null);
      })
      .catch((err) => {
        console.error('Failed to load Nova Scotia diagnostic overview points', err);
        setPoints([]);
        setLoadError('Nova Scotia diagnostic layer unavailable.');
      });
  }, []);

  const scenarioPoints = useMemo<DynamicNsMapPoint[]>(() => {
    const communities = new Map<string, NsMapPoint[]>();
    for (const point of points) {
      const group = communities.get(point.community_id) ?? [];
      group.push(point);
      communities.set(point.community_id, group);
    }

    const windFactor = stormInputs.windSpeed / 10;
    const rainFactor = stormInputs.rainIntensity / 10;
    const tideFactor = stormInputs.tideSurge / 10;

    const dynamicPoints = Array.from(communities.values()).flatMap((communityPoints) => {
      const byScenario = scoreByScenario(communityPoints);
      const baseline = byScenario.normal_baseline;
      if (!baseline) return [];

      const fionaScore = byScenario.fiona_style_wind_cascade?.risk_score;
      const inlandWindScore = byScenario.inland_wind_tree?.risk_score;
      const coastalScore = byScenario.coastal_rain_surge?.risk_score;
      const fionaWindSensitivity = fionaScore == null ? null : fionaScore - baseline.risk_score;
      const inlandWindSensitivity = inlandWindScore == null ? null : inlandWindScore - baseline.risk_score;
      const availableWindSensitivities = [fionaWindSensitivity, inlandWindSensitivity].filter(
        (value): value is number => value != null
      );
      const windSensitivity = availableWindSensitivities.length > 0 ? Math.max(...availableWindSensitivities) : 0;
      const rainSensitivity = coastalScore == null ? 0 : coastalScore - baseline.risk_score;
      const coastalSensitivity = coastalScore == null ? 0 : coastalScore - baseline.risk_score;
      const dynamicScore = clampScore(
        baseline.risk_score +
          windFactor * windSensitivity +
          rainFactor * rainSensitivity +
          tideFactor * coastalSensitivity
      );

      const dynamicPoint: DynamicNsMapPoint = {
        ...baseline,
        scenario_id: 'dynamic_diagnostic',
        risk_score: Math.round(dynamicScore * 10) / 10,
        baseline_score: baseline.risk_score,
        dynamic_score: Math.round(dynamicScore * 10) / 10,
        wind_sensitivity: Math.round(windSensitivity * 10) / 10,
        rain_sensitivity: Math.round(rainSensitivity * 10) / 10,
        coastal_sensitivity: Math.round(coastalSensitivity * 10) / 10,
        display_priority_band: 'Low',
        rank_within_scenario: 0,
        percentile_within_scenario: 1,
        source_scenarios: Object.keys(byScenario).sort(),
      };
      return [dynamicPoint];
    });

    const ranked = dynamicPoints.sort((a, b) => b.dynamic_score - a.dynamic_score);
    return ranked.map((point, index) => ({
      ...point,
      display_priority_band: displayPriorityBandFor(point.dynamic_score, index, ranked.length, stormInputs),
      priority_band: displayPriorityBandFor(point.dynamic_score, index, ranked.length, stormInputs),
      priority_percentile: (index + 1) / Math.max(ranked.length, 1),
      rank_within_scenario: index + 1,
      percentile_within_scenario: (index + 1) / Math.max(ranked.length, 1),
    }));
  }, [points, stormInputs.rainIntensity, stormInputs.tideSurge, stormInputs.windSpeed]);

  const countySummaries = useMemo<CountySummary[]>(() => {
    const groups = new Map<string, DynamicNsMapPoint[]>();
    for (const point of scenarioPoints) {
      if (!point.county) continue;
      const group = groups.get(point.county) ?? [];
      group.push(point);
      groups.set(point.county, group);
    }

    return Array.from(groups.entries())
      .map(([county, countyPoints]) => {
        const sorted = [...countyPoints].sort((a, b) => b.dynamic_score - a.dynamic_score);
        const top5 = sorted.slice(0, 5);
        const maxRisk = sorted[0]?.dynamic_score ?? 0;
        const averageTop5 = top5.reduce((sum, point) => sum + point.dynamic_score, 0) / Math.max(top5.length, 1);
        const highRiskCount = countyPoints.filter((point) => point.display_priority_band === 'High' || point.display_priority_band === 'Critical').length;
        const highRiskShare = highRiskCount / countyPoints.length;
        const center: [number, number] = [
          countyPoints.reduce((sum, point) => sum + point.lat, 0) / countyPoints.length,
          countyPoints.reduce((sum, point) => sum + point.lon, 0) / countyPoints.length,
        ];

        return {
          county,
          center,
          county_priority_score: 0.55 * maxRisk + 0.3 * averageTop5 + 0.15 * highRiskShare * 100,
          max_risk: maxRisk,
          average_top5_risk: averageTop5,
          high_risk_share: highRiskShare,
          high_risk_count: highRiskCount,
          community_count: countyPoints.length,
          highest_risk_community: sorted[0],
        };
      })
      .sort((a, b) => b.county_priority_score - a.county_priority_score);
  }, [scenarioPoints]);

  const topCounties = useMemo(() => countySummaries.slice(0, 10), [countySummaries]);
  const topCountyNames = useMemo(() => new Set(countySummaries.slice(0, 5).map((county) => county.county)), [countySummaries]);

  const selectedCountyCommunities = useMemo(() => {
    if (!selectedCounty) return [];
    return scenarioPoints
      .filter((point) => point.county === selectedCounty)
      .sort((a, b) => b.dynamic_score - a.dynamic_score);
  }, [scenarioPoints, selectedCounty]);

  const visibleCommunities = useMemo(() => {
    if (selectedCounty) return selectedCountyCommunities;
    if (zoom <= 7.5) return [];
    return scenarioPoints
      .filter((point) => pointInBounds(point, mapBounds))
      .sort((a, b) => b.dynamic_score - a.dynamic_score)
      .slice(0, 150);
  }, [mapBounds, scenarioPoints, selectedCounty, selectedCountyCommunities, zoom]);

  const visiblePriorityCommunities = useMemo<VisiblePriorityCommunity[]>(() => {
    return scenarioPoints
      .filter((point) => pointInBounds(point, mapBounds))
      .filter((point) => point.display_priority_band === 'Critical' || point.display_priority_band === 'High')
      .sort((a, b) => {
        const bandRank = (band: string) => (band === 'Critical' ? 0 : 1);
        const bandDelta = bandRank(a.display_priority_band) - bandRank(b.display_priority_band);
        if (bandDelta !== 0) return bandDelta;
        const scoreDelta = b.dynamic_score - a.dynamic_score;
        if (scoreDelta !== 0) return scoreDelta;
        return a.community_name.localeCompare(b.community_name);
      })
      .map((point) => ({
        community_id: point.community_id,
        community_name: point.community_name,
        county: point.county,
        display_priority_band: point.display_priority_band,
        dynamic_score: point.dynamic_score,
        confidence_band: point.confidence_band,
      }));
  }, [mapBounds, scenarioPoints]);

  useEffect(() => {
    onVisiblePriorityCommunitiesChange?.(visiblePriorityCommunities);
  }, [onVisiblePriorityCommunitiesChange, visiblePriorityCommunities]);

  const focusedCommunity = useMemo(() => {
    if (!focusedCommunityId) return null;
    return scenarioPoints.find((point) => point.community_id === focusedCommunityId) ?? null;
  }, [focusedCommunityId, scenarioPoints]);

  const countyTopCommunityNames = useMemo(() => {
    return new Set(
      (selectedCounty ? selectedCountyCommunities : visibleCommunities)
        .slice(0, selectedCounty ? 3 : 5)
        .map((point) => point.community_name)
    );
  }, [selectedCounty, selectedCountyCommunities, visibleCommunities]);

  const displayedCountySummaries = useMemo(() => {
    if (selectedCounty) return [];
    if (zoom <= 7.5) return topCounties;
    if (zoom < 9.5) {
      return topCounties.filter((county) => {
        const [lat, lon] = county.center;
        if (!mapBounds) return true;
        return lat <= mapBounds.north && lat >= mapBounds.south && lon <= mapBounds.east && lon >= mapBounds.west;
      });
    }
    return [];
  }, [mapBounds, selectedCounty, topCounties, zoom]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={NS_CENTER}
        zoom={NS_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="rounded-l-lg"
        zoomControl={true}
      >
        {mode === 'overview' && <NovaScotiaMapFocus />}
        <NovaScotiaMapState onZoomChange={setZoom} onBoundsChange={setMapBounds} />
        {selectedCounty && <CountyFocus communities={selectedCountyCommunities} />}
        <CommunityFocus
          community={focusedCommunity}
          onFocused={(communityId) => {
            setSelectedCommunity(communityId);
          }}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <div
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
          className="bg-white/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-700 max-w-sm shadow"
        >
          <p className="font-semibold mb-1">Nova Scotia Diagnostic Overview</p>
          <p className="text-[11px] text-gray-500">
            {mode === 'county'
              ? 'County drill-down shows selected county communities from the available provincial diagnostic layer.'
              : 'NS Overview shows high-priority county summaries across Nova Scotia. Select a county to inspect communities.'}
          </p>
          <p className="text-[11px] text-gray-700 mt-1">
            Active NS layer: <span className="font-semibold">Dynamic diagnostic score</span>
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Scenario mode: <span className="font-semibold">{activeScenarioLabel}</span>
          </p>
          <p className="text-[10px] text-amber-700 mt-1">
            Nova Scotia view uses dynamic diagnostic scores derived from precomputed scenario layers. Final V7 experiment evidence remains offline diagnostic; HRM has the live demo-ready feature contract when selected.
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Priority bands are relative triage bands within the current scenario. They are not outage probabilities.
          </p>
          {loadError && <p className="text-[11px] text-red-600 mt-1">{loadError}</p>}
        </div>

        {selectedCounty && mode === 'overview' && (
          <button
            type="button"
            onClick={() => {
              setSelectedCounty(null);
              setSelectedCommunity(null);
            }}
            style={{ position: 'absolute', top: 88, right: 10, zIndex: 1000 }}
            className="rounded bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow"
          >
            Back to NS Overview
          </button>
        )}

        {displayedCountySummaries.map((county, index) => {
          const color = riskColor(county.county_priority_score);
          const showPermanentLabel = topCountyNames.has(county.county);

          return (
            <CircleMarker
              key={`dynamic-${county.county}`}
              center={county.center}
              radius={10 + Math.min(18, county.county_priority_score / 4)}
              eventHandlers={{
                click: () => setSelectedCounty(county.county),
              }}
              pathOptions={{
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 0.78,
                weight: 2,
              }}
            >
              <Tooltip
                permanent={showPermanentLabel}
                direction="top"
                opacity={1}
                className={
                  showPermanentLabel
                    ? '!bg-white !border !border-gray-300 !shadow-sm !px-1.5 !py-0.5 !rounded'
                    : ''
                }
              >
                <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
                  {county.county}
                  <div className="text-[10px] font-medium text-gray-600">
                    {county.county_priority_score.toFixed(1)} priority
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="min-w-[230px] p-2">
                  <h3 className="font-bold text-base mb-1">{county.county} County</h3>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-gray-500">County priority score</span>
                    <span className="text-right font-semibold">{county.county_priority_score.toFixed(1)}/100</span>
                    <span className="text-gray-500">Band</span>
                    <span className="text-right font-semibold">{countyRiskBand(county.county_priority_score)}</span>
                    <span className="text-gray-500">Highest-risk community</span>
                    <span className="text-right font-semibold">{county.highest_risk_community.community_name}</span>
                    <span className="text-gray-500">High-risk community count</span>
                    <span className="text-right font-semibold">{county.high_risk_count}</span>
                    <span className="text-gray-500">Rank</span>
                    <span className="text-right font-semibold">#{index + 1}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mt-2">Click marker to drill down.</p>
                  <p className="text-[10px] text-amber-600 italic mt-2 border-t border-gray-100 pt-2">
                    <span className="font-semibold">Limitation:</span> {LIMITATION}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {visibleCommunities.map((point) => {
          const displayBand = point.display_priority_band ?? point.priority_band ?? point.risk_band;
          const color = priorityColor(displayBand);
          const isSelected = selectedCommunity === point.community_id;
          const showPermanentLabel =
            isSelected || countyTopCommunityNames.has(point.community_name) || DEMO_ANCHORS.has(point.community_name);

          return (
            <CircleMarker
              key={`dynamic-${point.community_id}`}
              center={[point.lat, point.lon]}
              radius={isSelected ? markerRadius(point.dynamic_score) + 4 : markerRadius(point.dynamic_score)}
              eventHandlers={{
                click: () => setSelectedCommunity(point.community_id),
              }}
              pathOptions={{
                color: isSelected ? '#111827' : '#ffffff',
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.72,
                weight: isSelected ? 4 : 1.5,
              }}
            >
              <Tooltip
                permanent={showPermanentLabel}
                direction={showPermanentLabel ? 'top' : 'auto'}
                opacity={1}
                className={
                  showPermanentLabel
                    ? '!bg-white !border !border-gray-300 !shadow-sm !px-1.5 !py-0.5 !rounded'
                    : ''
                }
              >
                <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
                  {point.community_name}
                </div>
              </Tooltip>

              <Popup>
                <div className="min-w-[240px] p-2">
                  <h3 className="font-bold text-base mb-1">{point.community_name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{point.county} County</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-gray-500">Risk</span>
                    <span className="text-right font-semibold">{point.dynamic_score.toFixed(1)}/100</span>
                    <span className="text-gray-500">Band</span>
                    <span className="text-right font-semibold">{displayBand}</span>
                    <span className="text-gray-500">Confidence</span>
                    <span className="text-right font-semibold">{point.confidence_band}</span>
                    <span className="text-gray-500">Why V7 ranked this community high</span>
                    <span className="text-right font-semibold">
                      Dynamic diagnostic score from baseline plus wind/rain/coastal sensitivity
                    </span>
                    <span className="text-gray-500">Recommended action</span>
                    <span className="text-right font-semibold">Review for storm response priority planning.</span>
                    <span className="text-gray-500">Baseline</span>
                    <span className="text-right font-semibold">{point.baseline_score.toFixed(1)}</span>
                    <span className="text-gray-500">Wind sensitivity</span>
                    <span className="text-right font-semibold">{point.wind_sensitivity.toFixed(1)}</span>
                    <span className="text-gray-500">Rain/coastal sensitivity</span>
                    <span className="text-right font-semibold">{point.rain_sensitivity.toFixed(1)}</span>
                    <span className="text-gray-500">Rank</span>
                    <span className="text-right font-semibold">#{point.rank_within_scenario}</span>
                    <span className="text-gray-500">Model unit</span>
                    <span className="text-right font-semibold">{point.community_id}</span>
                  </div>
                  <p className="text-[10px] text-amber-600 italic mt-2 border-t border-gray-100 pt-2">
                    <span className="font-semibold">Limitation:</span> {LIMITATION}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
