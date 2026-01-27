'use client';

interface AuditResult {
  id: string;
  type: 'technical' | 'content' | 'competitor';
  status: 'pending' | 'completed' | 'failed';
  results?: {
    siteAudit?: {
      scores: {
        aiReadiness: number;
        structure: number;
        contentDepth: number;
        technicalReadiness: number;
        overall: number;
      };
    };
    technical?: {
      schema?: { score: number; issues: string[] };
      performance?: { score: number; issues: string[] };
      seo?: { score: number; issues: string[]; recommendations: string[] };
      aiSearchOptimization?: { score: number; issues: string[]; recommendations: string[] };
      accessibility?: { score: number; issues: string[] };
      security?: { score: number; issues: string[] };
    };
    schema?: { score: number; issues: string[] };
    performance?: { score: number; issues: string[] };
    seo?: { score: number; issues: string[]; recommendations: string[] };
    aiSearchOptimization?: { score: number; issues: string[]; recommendations: string[] };
    accessibility?: { score: number; issues: string[] };
    security?: { score: number; issues: string[] };
  };
  recommendations?: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact?: string;
    effort?: 'low' | 'medium' | 'high';
  }>;
  createdAt: Date;
}

interface AuditResultsProps {
  audit: AuditResult;
}

export default function AuditResults({ audit }: AuditResultsProps) {
  if (audit.status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Audit in progress...</p>
      </div>
    );
  }

  if (audit.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Audit failed. Please try again.</p>
      </div>
    );
  }

  if (!audit.results) {
    return null;
  }

  const results = audit.results;
  const siteAudit = results.siteAudit;
  const technical = results.technical || results;
  const aiOptimization = technical.aiSearchOptimization || technical.seo;

  return (
    <div className="space-y-6">
      {/* Category Scores */}
      {siteAudit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ScoreCard title="Overall" score={siteAudit.scores.overall} />
          <ScoreCard title="AI Readiness" score={siteAudit.scores.aiReadiness} />
          <ScoreCard title="Structure" score={siteAudit.scores.structure} />
          <ScoreCard title="Content Depth" score={siteAudit.scores.contentDepth} />
          <ScoreCard title="Technical Readiness" score={siteAudit.scores.technicalReadiness} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiOptimization && (
            <ScoreCard
              title="AI Search Optimization"
              score={aiOptimization.score}
              issues={aiOptimization.issues}
            />
          )}
          {technical.performance && (
            <ScoreCard title="Performance" score={technical.performance.score} issues={technical.performance.issues} />
          )}
          {technical.security && (
            <ScoreCard title="Security" score={technical.security.score} issues={technical.security.issues} />
          )}
          {technical.accessibility && (
            <ScoreCard title="Accessibility" score={technical.accessibility.score} issues={technical.accessibility.issues} />
          )}
        </div>
      )}

      {/* Recommendations */}
      {audit.recommendations && audit.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Recommendations</h3>
          <div className="space-y-3">
            {audit.recommendations.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* AI Search Optimization Recommendations */}
      {!siteAudit && aiOptimization?.recommendations && aiOptimization.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">AI Search Optimization Recommendations</h3>
          <ul className="list-disc list-inside space-y-2">
            {aiOptimization.recommendations.map((rec, index) => (
              <li key={index} className="text-gray-700">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  title,
  score,
  issues,
}: {
  title: string;
  score: number;
  issues?: string[];
}) {
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className={`text-3xl font-bold ${scoreColor} mb-2`}>{score}/100</div>
      {issues && issues.length > 0 && (
        <div className="text-sm text-gray-600">
          {issues.length} issue{issues.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact?: string;
    effort?: 'low' | 'medium' | 'high';
  };
}) {
  const priorityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{recommendation.category}</span>
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[recommendation.priority]}`}>
              {recommendation.priority}
            </span>
          </div>
          <p className="text-sm font-medium mb-1">{recommendation.issue}</p>
          <p className="text-sm text-gray-700">{recommendation.recommendation}</p>
          {recommendation.impact && (
            <p className="text-xs text-gray-500 mt-2">Impact: {recommendation.impact}</p>
          )}
          {recommendation.effort && (
            <p className="text-xs text-gray-500">Effort: {recommendation.effort}</p>
          )}
        </div>
      </div>
    </div>
  );
}
