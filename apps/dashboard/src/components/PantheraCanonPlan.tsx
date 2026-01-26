'use client';

interface OptimizationPhase {
  id: string;
  name: string;
  description: string;
  actions: Array<{
    id: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    estimatedTime?: string;
  }>;
  estimatedDuration: string;
}

interface PantheraCanonPlanData {
  id: string;
  optimizationType: string;
  status: 'draft' | 'active' | 'completed';
  phases: OptimizationPhase[];
  overallGoals: string[];
  successMetrics: {
    authorityScore?: { current: number; target: number };
    seoScore?: { current: number; target: number };
    aiSearchScore?: { current: number; target: number };
  };
}

interface PantheraCanonPlanProps {
  plan: PantheraCanonPlanData;
}

export default function PantheraCanonPlan({ plan }: PantheraCanonPlanProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Panthera Canon Optimization Plan</h2>
            <p className="text-gray-600 mt-1">Type: {plan.optimizationType}</p>
          </div>
          <span className={`px-3 py-1 rounded ${
            plan.status === 'active' ? 'bg-green-100 text-green-800' :
            plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {plan.status}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Overall Goals</h3>
          <ul className="list-disc list-inside space-y-1">
            {plan.overallGoals.map((goal, index) => (
              <li key={index} className="text-gray-700">{goal}</li>
            ))}
          </ul>
        </div>

        {plan.successMetrics.authorityScore && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Success Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Authority Score</div>
                <div className="text-lg font-semibold">
                  {plan.successMetrics.authorityScore.current} → {plan.successMetrics.authorityScore.target}
                </div>
              </div>
              {(plan.successMetrics.aiSearchScore || plan.successMetrics.seoScore) && (
                <div>
                  <div className="text-sm text-gray-600">{plan.successMetrics.aiSearchScore ? 'AI Search Score' : 'SEO Score'}</div>
                  <div className="text-lg font-semibold">
                    {(plan.successMetrics.aiSearchScore || plan.successMetrics.seoScore)!.current} → {(plan.successMetrics.aiSearchScore || plan.successMetrics.seoScore)!.target}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {plan.phases.map((phase, phaseIndex) => (
          <PhaseCard key={phase.id} phase={phase} phaseNumber={phaseIndex + 1} />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, phaseNumber }: { phase: OptimizationPhase; phaseNumber: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {phaseNumber}
          </span>
          <h3 className="text-xl font-bold">{phase.name}</h3>
        </div>
        <p className="text-gray-600">{phase.description}</p>
        <div className="text-sm text-gray-500 mt-1">Estimated Duration: {phase.estimatedDuration}</div>
      </div>

      <div className="space-y-3">
        {phase.actions.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

function ActionItem({
  action,
}: {
  action: OptimizationPhase['actions'][0];
}) {
  const priorityColors = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500',
    low: 'border-blue-500',
  };

  return (
    <div className={`border-l-4 pl-4 py-2 ${priorityColors[action.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{action.description}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              action.priority === 'critical' ? 'bg-red-100 text-red-800' :
              action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {action.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{action.impact}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Effort: {action.effort}</span>
            {action.estimatedTime && <span>Time: {action.estimatedTime}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
