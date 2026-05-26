import { useCallback, useEffect, useMemo, useState } from 'react';
import StormControls from '../components/StormControls';
import ScenarioButtons from '../components/ScenarioButtons';
import DeploymentPanel from '../components/DeploymentPanel';
import Legend from '../components/Legend';
import { demoScenarios } from '../data/demoScenarios';
import type { StormInput } from '../engine/riskTypes';
import { getTopDeploymentRecommendations, loadDeploymentRecommendations } from '../engine/deploymentEngine';
import type { ScenarioDeploymentRecommendations } from '../engine/deploymentEngine';

import NovaScotiaOverview from '../components/NovaScotiaOverview';
import HrmCommunityView from '../components/HrmCommunityView';
import HrmCommunityTopPanel from '../components/HrmCommunityTopPanel';
import ViewModeToggle from '../components/ViewModeToggle';
import VisiblePriorityCommunitiesPanel, {
  type VisiblePriorityCommunity,
} from '../components/VisiblePriorityCommunitiesPanel';
import {
  adjustAllCommunityRisks,
  loadCommunityFeatures,
  type CommunityFeatureRecord,
  type CommunityRiskResult,
} from '../engine/communityRiskEngine';

type NsMapPoint = {
  community_id: string;
  community_name: string;
  county: string;
  scenario_id: string;
  risk_score: number;
  risk_band: string;
  confidence_band: string;
  priority_band?: string;
};

type DynamicNsMapPoint = NsMapPoint & {
  baseline_score: number;
  dynamic_score: number;
  display_priority_band: string;
};

type ViewMode = 'ns' | 'county' | 'action';

function isHrmCounty(county: string | null): boolean {
  return county === 'Halifax' || county === 'HRM';
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

function scoreByScenario(points: NsMapPoint[]): Record<string, NsMapPoint> {
  return points.reduce<Record<string, NsMapPoint>>((acc, point) => {
    acc[point.scenario_id] = point;
    return acc;
  }, {});
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export default function App() {
  const [communityFeatures, setCommunityFeatures] = useState<CommunityFeatureRecord[]>([]);
  const [storm, setStorm] = useState<StormInput>({
    rainIntensity: 2,
    windSpeed: 2,
    tideSurge: 1,
    crowdPressure: 3,
  });
  const [activeScenario, setActiveScenario] = useState<string | null>('normal');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>('ns');
  const [nsPoints, setNsPoints] = useState<NsMapPoint[]>([]);
  const [visiblePriorityCommunities, setVisiblePriorityCommunities] = useState<VisiblePriorityCommunity[]>([]);
  const [focusedCommunityId, setFocusedCommunityId] = useState<string | null>(null);
  const [deployments, setDeployments] = useState<ScenarioDeploymentRecommendations | null>(null);
  const [adjustedCommunities, setAdjustedCommunities] = useState<CommunityRiskResult[]>([]);

  useEffect(() => {
    loadCommunityFeatures()
      .then(setCommunityFeatures)
      .catch((err) => {
        console.error('Failed to load HRM community features', err);
        setCommunityFeatures([]);
      });
  }, []);

  useEffect(() => {
    if (communityFeatures.length === 0) return;
    const scenarioKey = activeScenario ?? 'normal';
    adjustAllCommunityRisks(communityFeatures, storm, scenarioKey)
      .then(setAdjustedCommunities)
      .catch((err) => {
        console.error('Failed to adjust community risks', err);
        setAdjustedCommunities([]);
      });
  }, [communityFeatures, activeScenario, storm]);

  useEffect(() => {
    loadDeploymentRecommendations()
      .then(setDeployments)
      .catch(() => setDeployments(null));
  }, []);

  useEffect(() => {
    if (isHrmCounty(selectedCounty)) {
      setNsPoints([]);
      return;
    }
    fetch('/data/ns_frontend_map_points.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Unable to load ns_frontend_map_points.json: ${res.status}`);
        return res.json();
      })
      .then((data) => setNsPoints(Array.isArray(data.points) ? data.points : []))
      .catch((err) => {
        console.error('Failed to load NS overview points for action panel', err);
        setNsPoints([]);
      });
  }, [selectedCounty]);

  const deployFirst3 = useMemo(
    () => getTopDeploymentRecommendations(deployments, activeScenario),
    [deployments, activeScenario]
  );

  const scenarioNsPoints = useMemo<DynamicNsMapPoint[]>(() => {
    const communities = new Map<string, NsMapPoint[]>();
    for (const point of nsPoints) {
      const group = communities.get(point.community_id) ?? [];
      group.push(point);
      communities.set(point.community_id, group);
    }

    const windFactor = storm.windSpeed / 10;
    const rainFactor = storm.rainIntensity / 10;
    const tideFactor = storm.tideSurge / 10;
    const dynamicPoints = Array.from(communities.values()).flatMap((communityPoints) => {
      const byScenario = scoreByScenario(communityPoints);
      const baseline = byScenario.normal_baseline;
      if (!baseline) return [];
      const fionaWindSensitivity = byScenario.fiona_style_wind_cascade == null
        ? null
        : byScenario.fiona_style_wind_cascade.risk_score - baseline.risk_score;
      const inlandWindSensitivity = byScenario.inland_wind_tree == null
        ? null
        : byScenario.inland_wind_tree.risk_score - baseline.risk_score;
      const windSensitivities = [fionaWindSensitivity, inlandWindSensitivity].filter(
        (value): value is number => value != null
      );
      const windSensitivity = windSensitivities.length > 0 ? Math.max(...windSensitivities) : 0;
      const coastalSensitivity = byScenario.coastal_rain_surge == null
        ? 0
        : byScenario.coastal_rain_surge.risk_score - baseline.risk_score;
      const dynamicScore = clampScore(
        baseline.risk_score + windFactor * windSensitivity + rainFactor * coastalSensitivity + tideFactor * coastalSensitivity
      );
      return [{
        ...baseline,
        scenario_id: 'dynamic_diagnostic',
        risk_score: Math.round(dynamicScore * 10) / 10,
        baseline_score: baseline.risk_score,
        dynamic_score: Math.round(dynamicScore * 10) / 10,
        display_priority_band: 'Low',
      }];
    });

    const ranked = dynamicPoints.sort((a, b) => b.dynamic_score - a.dynamic_score);
    return ranked.map((point, index) => ({
      ...point,
      priority_band: displayPriorityBandFor(point.dynamic_score, index, ranked.length, storm),
      display_priority_band: displayPriorityBandFor(point.dynamic_score, index, ranked.length, storm),
    }));
  }, [nsPoints, storm.rainIntensity, storm.tideSurge, storm.windSpeed]);

  const selectedCountyTop3 = useMemo(() => {
    if (!selectedCounty) return [];
    return scenarioNsPoints
      .filter((point) => point.county === selectedCounty)
      .sort((a, b) => b.dynamic_score - a.dynamic_score)
      .slice(0, 3);
  }, [scenarioNsPoints, selectedCounty]);

  const handleVisiblePriorityCommunitiesChange = useCallback((communities: VisiblePriorityCommunity[]) => {
    setVisiblePriorityCommunities(communities);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setSelectedCommunity(null);
    setFocusedCommunityId(null);

    if (mode === 'ns') {
      setSelectedCounty(null);
      return;
    }

    setSelectedCounty('Halifax');
  }, []);

  const handleSelectCounty = useCallback((county: string | null) => {
    setSelectedCounty(county);
    setSelectedCommunity(null);
    setFocusedCommunityId(null);

    if (isHrmCounty(county)) {
      setViewModeState('county');
    } else {
      setViewModeState('ns');
    }
  }, []);

  const handleScenarioSelect = (key: string, scenario: StormInput) => {
    setActiveScenario(key);
    setStorm({
      rainIntensity: scenario.rainIntensity,
      windSpeed: scenario.windSpeed,
      tideSurge: scenario.tideSurge,
      crowdPressure: scenario.crowdPressure,
    });
  };

  const clearCountySelection = () => {
    setSelectedCounty(null);
    setSelectedCommunity(null);
    setFocusedCommunityId(null);
    setViewModeState('ns');
  };

  useEffect(() => {
    if (isHrmCounty(selectedCounty)) {
      setVisiblePriorityCommunities([]);
      setFocusedCommunityId(null);
    }
  }, [selectedCounty]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-gray-900 text-white px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">StormGrid V7 Triage Engine</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
              StormGrid V7 Command View
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Community storm-response priority ranking only.
            </p>
          </div>
        </div>
      </header>

      <div className="bg-blue-900 text-white px-5 py-1.5 text-center flex-shrink-0">
        <p className="text-xs font-medium text-blue-200">
          StormGrid V7 Command View uses V7 model evidence and diagnostic layers for community storm-response priority ranking.
        </p>
        <p className="text-xs text-blue-100">
          NS Overview is a provincial diagnostic layer. HRM contains the live demo-ready feature contract. Final V7 experiment evidence remains offline diagnostic.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 flex flex-col bg-gray-100">
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-2 shadow-sm z-[1001]">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          <div className="flex-1 min-h-0 relative">
            {viewMode === 'ns' ? (
              <NovaScotiaOverview
                activeScenario={activeScenario}
                stormInputs={storm}
                mode={selectedCounty ? 'county' : 'overview'}
                selectedCounty={selectedCounty}
                focusedCommunityId={focusedCommunityId}
                onSelectCounty={handleSelectCounty}
                onVisiblePriorityCommunitiesChange={handleVisiblePriorityCommunitiesChange}
              />
            ) : (
              <HrmCommunityView
                communities={adjustedCommunities}
                selectedCommunity={selectedCommunity}
                onSelectCommunity={setSelectedCommunity}
              />
            )}
            <div className="absolute bottom-3 left-3 z-[1000]">
              <Legend />
            </div>
          </div>
        </div>

        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col overflow-y-auto bg-gray-100 p-3 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Scenario Controls
            </h2>
            <StormControls
              storm={storm}
              onChange={(newStorm) => {
                setStorm(newStorm);
                setActiveScenario(null);
              }}
            />
            <div className="mt-4">
              <ScenarioButtons
                scenarios={demoScenarios}
                activeScenario={activeScenario}
                onSelect={handleScenarioSelect}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Selected County
                </h2>
                <p className="text-sm font-bold text-gray-900">
                  {selectedCounty ? `${selectedCounty} County` : 'No county selected'}
                </p>
              </div>
              {selectedCounty && (
                <button
                  type="button"
                  onClick={clearCountySelection}
                  className="rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white"
                >
                  Back to NS
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {selectedCounty
                ? isHrmCounty(selectedCounty)
                  ? 'HRM uses the richer live feature contract for detailed community triage.'
                  : 'This county uses available provincial diagnostic community points.'
                : 'Province view shows high-priority county summaries. Select a county to inspect communities.'}
            </p>
            <p className="text-[10px] text-amber-600 italic mt-2">
              StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.
            </p>
          </div>

          {selectedCounty && isHrmCounty(selectedCounty) && (
            <HrmCommunityTopPanel communities={adjustedCommunities} />
          )}

          <VisiblePriorityCommunitiesPanel
            communities={visiblePriorityCommunities}
            onSelectCommunity={setFocusedCommunityId}
          />

          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Action Plan
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              HRM has demo-ready action recommendations by storm preset. Other counties show top communities to inspect first.
            </p>
            {isHrmCounty(selectedCounty) ? (
              activeScenario ? (
                <>
                  {deployFirst3.length > 0 && (
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {deployFirst3.length} recommended HRM actions
                    </h3>
                  )}
                  <DeploymentPanel recommendations={deployFirst3} />
                </>
              ) : (
                <p className="text-xs text-gray-500 rounded-lg border border-gray-200 bg-white p-3">
                  Select a storm preset to load HRM deploy-first recommendations.
                </p>
              )
            ) : selectedCounty ? (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Top communities to inspect first
                </h3>
                {selectedCountyTop3.map((point, index) => (
                  <div key={point.community_id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">#{index + 1} {point.community_name}</p>
                      <span className="text-xs font-bold text-gray-600">{point.priority_band ?? point.risk_band}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Risk: {point.dynamic_score.toFixed(1)}/100</p>
                    <p className="text-xs text-gray-600">Priority band: {point.display_priority_band}</p>
                    <p className="text-xs text-gray-600">Baseline: {point.baseline_score.toFixed(1)}/100</p>
                    <p className="text-xs text-gray-600">Confidence: {point.confidence_band}</p>
                    <p className="text-xs text-gray-600">Recommended action: Review for storm response priority planning.</p>
                  </div>
                ))}
                {selectedCountyTop3.length === 0 && (
                  <p className="text-xs text-gray-500 rounded-lg border border-gray-200 bg-white p-3">
                    No county diagnostic communities are available for the current storm inputs.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 rounded-lg border border-gray-200 bg-white p-3">
                Select a county to populate the action plan. This panel does not claim universal deployment optimization.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
