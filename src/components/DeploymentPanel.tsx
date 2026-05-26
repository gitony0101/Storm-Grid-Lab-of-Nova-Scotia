import type { DeploymentRecommendation } from '../engine/deploymentEngine';

interface DeploymentPanelProps {
  recommendations: DeploymentRecommendation[];
}

// Helper to derive/display fields when missing in JSON
const getPriorityScore = (rec: DeploymentRecommendation): number | null => {
  if (rec.covered_risk_score && rec.covered_risk_score > 0) return rec.covered_risk_score;
  if (rec.candidate_score && rec.candidate_score > 0) return rec.candidate_score;
  return null; // No real score available — display as demo placeholder
};

const getConfidence = (rec: DeploymentRecommendation): string | null => {
  if (rec.evidence && Object.keys(rec.evidence).length > 0) return 'Estimated';
  return null; // No real evidence available — display as demo placeholder
};

// Extract up to three driver phrases from primary_reason
const getTopDrivers = (rec: DeploymentRecommendation): string[] => {
  if (!rec.primary_reason) return [];
  // Split on commas and take first three trimmed parts
  const parts = rec.primary_reason.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3);
  // Fallback: split on spaces and take unique words (naive)
  const words = rec.primary_reason.split(' ').filter(Boolean);
  return words.slice(0, 3);
};

export default function DeploymentPanel({ recommendations }: DeploymentPanelProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-3">
        Select a storm preset to load deploy-first recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const priorityScore = getPriorityScore(rec);
        const confidence = getConfidence(rec);
        const topDrivers = getTopDrivers(rec);
        const evidenceItems = Object.entries(rec.evidence || {});
        return (
          <div key={rec.site_id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white mr-2">
                {rec.rank}
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{rec.site_name}</h3>
            </div>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">Response Priority Score:</span>{' '}
              {priorityScore !== null ? priorityScore.toFixed(1) : 'N/A (demo placeholder)'}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">Recommended Action:</span> {rec.recommended_action}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">Response Priority Drivers:</span> {topDrivers.join(', ')}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">Confidence:</span> {confidence ?? 'N/A (demo placeholder)'}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">Evidence:</span>
            </p>
            <ul className="list-disc list-inside text-xs text-gray-600 mb-2">
              {evidenceItems.map(([k, v]) => (
                <li key={k}> {k.replace('_', ' ')}: {typeof v === 'number' ? v.toFixed(2) : String(v)} </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 italic">StormGrid V7 ranks response priority. It does not predict outage probability, household impact, pole failure, feeder failure, or restoration time.</p>
          </div>
        );
      })}
    </div>
  );
}
