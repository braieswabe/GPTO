'use client';

interface ScorecardData {
  overallScore: number;
  categoryScores: {
    aiReadiness?: number;
    structure?: number;
    contentDepth?: number;
    technicalReadiness?: number;
    schema?: number;
    performance?: number;
    seo?: number;
    aiSearchOptimization?: number;
    accessibility?: number;
    security?: number;
    content?: number;
  };
  recommendations: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface ScorecardProps {
  scorecard: ScorecardData;
}

export default function Scorecard({ scorecard }: ScorecardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">GPTO Scorecard</h2>
        <div className={`inline-block text-6xl font-bold ${getScoreColor(scorecard.overallScore).replace('bg-', 'text-')}`}>
          {scorecard.overallScore}
        </div>
        <div className="text-gray-600 text-lg">/ 100</div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-4">Category Scores</h3>
          <div className="space-y-4">
            {Object.entries(scorecard.categoryScores).map(([category, score]) => {
              if (score === undefined) return null;
              // Skip seo if aiSearchOptimization exists
              if (category === 'seo' && scorecard.categoryScores.aiSearchOptimization !== undefined) return null;
              const displayLabelMap: Record<string, string> = {
                aiSearchOptimization: 'AI Search Optimization',
                aiReadiness: 'AI Readiness',
                structure: 'Structure',
                contentDepth: 'Content Depth',
                technicalReadiness: 'Technical Readiness',
                seo: 'SEO',
                schema: 'Schema',
                performance: 'Performance',
                accessibility: 'Accessibility',
                security: 'Security',
                content: 'Content',
              };
              const displayLabel = displayLabelMap[category] || category;
              return (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{displayLabel}</span>
                    <span className="font-semibold">{score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getScoreColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Recommendations Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{scorecard.recommendations.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{scorecard.recommendations.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{scorecard.recommendations.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{scorecard.recommendations.low}</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
