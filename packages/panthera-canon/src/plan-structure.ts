export type OptimizationType = 'authority' | 'semantic' | 'content' | 'technical' | 'comprehensive';

export interface OptimizationAction {
  id: string;
  type: 'schema' | 'content' | 'link' | 'technical' | 'semantic';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedTime?: string;
  dependencies?: string[]; // IDs of other actions that must be completed first
}

export interface OptimizationPhase {
  id: string;
  name: string;
  description: string;
  actions: OptimizationAction[];
  estimatedDuration: string;
}

export interface PantheraCanonPlan {
  id: string;
  siteId: string;
  tier: 'bronze' | 'silver' | 'gold';
  optimizationType: OptimizationType;
  status: 'draft' | 'active' | 'completed';
  phases: OptimizationPhase[];
  overallGoals: string[];
  successMetrics: {
    authorityScore?: { current: number; target: number };
    seoScore?: { current: number; target: number };
    sentimentScore?: { current: number; target: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a structured plan from audit data
 */
export function createPlanStructure(
  siteId: string,
  tier: 'bronze' | 'silver' | 'gold',
  optimizationType: OptimizationType,
  auditData?: {
    technicalAudit?: unknown;
    contentAudit?: unknown;
    recommendations?: unknown[];
  }
): PantheraCanonPlan {
  const phases: OptimizationPhase[] = [];
  const overallGoals: string[] = [];
  const successMetrics: {
    authorityScore?: { current: number; target: number };
    seoScore?: { current: number; target: number };
    sentimentScore?: { current: number; target: number };
  } = {};

  // Phase 1: Foundation (always included)
  phases.push({
    id: 'foundation',
    name: 'Foundation Setup',
    description: 'Establish core schema and technical foundation',
    actions: [
      {
        id: 'schema-org',
        type: 'schema',
        priority: 'critical',
        description: 'Implement Organization schema',
        impact: 'High - Establishes brand identity in search',
        effort: 'low',
        estimatedTime: '1-2 hours',
      },
    ],
    estimatedDuration: '1-2 days',
  });

  // Phase 2: Authority Building (Silver+)
  if (tier === 'silver' || tier === 'gold') {
    phases.push({
      id: 'authority',
      name: 'Authority Optimization',
      description: 'Build authority signals and trust indicators',
      actions: [
        {
          id: 'authority-grove',
          type: 'schema',
          priority: 'high',
          description: 'Configure Authority Grove with partner networks',
          impact: 'High - Builds trust graph and authority signals',
          effort: 'medium',
          estimatedTime: '2-4 hours',
        },
        {
          id: 'backlink-strategy',
          type: 'link',
          priority: 'high',
          description: 'Develop backlink acquisition strategy',
          impact: 'High - Improves domain authority',
          effort: 'high',
          estimatedTime: 'Ongoing',
        },
      ],
      estimatedDuration: '2-4 weeks',
    });
  }

  // Phase 3: Semantic Optimization (Silver+)
  if (tier === 'silver' || tier === 'gold') {
    phases.push({
      id: 'semantic',
      name: 'Semantic Optimization',
      description: 'Enhance semantic understanding and content structure',
      actions: [
        {
          id: 'schema-expansion',
          type: 'schema',
          priority: 'medium',
          description: 'Add Product/Service/LocalBusiness schemas',
          impact: 'Medium - Improves rich snippet eligibility',
          effort: 'medium',
          estimatedTime: '3-5 hours',
        },
        {
          id: 'content-structure',
          type: 'content',
          priority: 'medium',
          description: 'Optimize content structure and headings',
          impact: 'Medium - Improves SEO and readability',
          effort: 'medium',
          estimatedTime: '4-6 hours',
        },
      ],
      estimatedDuration: '1-2 weeks',
    });
  }

  // Phase 4: Advanced Optimization (Gold only)
  if (tier === 'gold') {
    phases.push({
      id: 'advanced',
      name: 'Advanced Optimization',
      description: 'Multi-market and AI-driven optimizations',
      actions: [
        {
          id: 'multi-market',
          type: 'semantic',
          priority: 'medium',
          description: 'Implement multi-market authority graph',
          impact: 'High - Expands reach across markets',
          effort: 'high',
          estimatedTime: '1-2 weeks',
        },
        {
          id: 'ai-link-building',
          type: 'link',
          priority: 'medium',
          description: 'AI-driven link and reputation building',
          impact: 'High - Automated authority growth',
          effort: 'high',
          estimatedTime: 'Ongoing',
        },
      ],
      estimatedDuration: '2-4 weeks',
    });
  }

  // Set goals based on tier
  overallGoals.push('Improve search visibility and authority');
  if (tier === 'silver' || tier === 'gold') {
    overallGoals.push('Build trust graph and partner network');
    overallGoals.push('Enhance semantic understanding');
  }
  if (tier === 'gold') {
    overallGoals.push('Establish multi-market presence');
    overallGoals.push('Implement AI-driven continuous optimization');
  }

  return {
    id: `plan-${siteId}-${Date.now()}`,
    siteId,
    tier,
    optimizationType,
    status: 'draft',
    phases,
    overallGoals,
    successMetrics,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
