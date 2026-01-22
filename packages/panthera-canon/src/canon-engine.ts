import { callLLM } from '@gpto/api-lattice';
import type { LLMProvider } from '@gpto/api-lattice';
import { createPlanStructure, type PantheraCanonPlan, type OptimizationType } from './plan-structure';
import type { TechnicalAuditResult } from '@gpto/audit';
import type { ContentAuditResult } from '@gpto/audit';
import type { StructuredRecommendations } from '@gpto/audit';

export interface GeneratePlanOptions {
  siteId: string;
  tier: 'bronze' | 'silver' | 'gold';
  optimizationType: OptimizationType;
  technicalAudit?: TechnicalAuditResult;
  contentAudit?: ContentAuditResult;
  recommendations?: StructuredRecommendations[];
}

/**
 * Generate optimization plan using AI
 */
export async function generateOptimizationPlan(
  options: GeneratePlanOptions
): Promise<PantheraCanonPlan> {
  const { siteId, tier, optimizationType, technicalAudit, contentAudit, recommendations } = options;

  // Create base plan structure
  let plan = createPlanStructure(siteId, tier, optimizationType, {
    technicalAudit,
    contentAudit,
    recommendations,
  });

  // Enhance plan with AI-generated insights if LLM is available
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    plan = await enhancePlanWithAI(plan, technicalAudit, contentAudit, recommendations);
  } else {
    // Use rule-based enhancement
    plan = enhancePlanWithRules(plan, technicalAudit, contentAudit, recommendations);
  }

  return plan;
}

/**
 * Enhance plan with AI-generated insights
 */
async function enhancePlanWithAI(
  plan: PantheraCanonPlan,
  technicalAudit?: TechnicalAuditResult,
  contentAudit?: ContentAuditResult,
  recommendations?: StructuredRecommendations[]
): Promise<PantheraCanonPlan> {
  // Build prompt for LLM
  const prompt = buildPlanPrompt(plan, technicalAudit, contentAudit, recommendations);

  try {
    // Call LLM to generate enhanced plan
    const provider: LLMProvider = process.env.OPENAI_API_KEY
      ? { name: 'openai', apiKey: process.env.OPENAI_API_KEY }
      : { name: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY! };

    const aiResponse = await callLLM(prompt, provider, {
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are an expert SEO and authority optimization strategist. Generate actionable, prioritized optimization plans.',
    });

    // Parse AI response and enhance plan
    // In production, would parse structured JSON from LLM
    // For now, use rule-based enhancement
    return enhancePlanWithRules(plan, technicalAudit, contentAudit, recommendations);
  } catch (error) {
    console.error('Error enhancing plan with AI:', error);
    // Fall back to rule-based enhancement
    return enhancePlanWithRules(plan, technicalAudit, contentAudit, recommendations);
  }
}

/**
 * Enhance plan with rule-based logic
 */
function enhancePlanWithRules(
  plan: PantheraCanonPlan,
  technicalAudit?: TechnicalAuditResult,
  contentAudit?: ContentAuditResult,
  recommendations?: StructuredRecommendations[]
): PantheraCanonPlan {
  // Add actions based on audit results
  if (technicalAudit) {
    // Add SEO actions
    if (technicalAudit.seo.score < 70) {
      plan.phases[0].actions.push({
        id: 'seo-fixes',
        type: 'technical',
        priority: 'high',
        description: 'Fix critical SEO issues',
        impact: 'High - Improves search visibility',
        effort: 'medium',
        estimatedTime: '4-8 hours',
        dependencies: ['schema-org'],
      });
    }

    // Add performance actions
    if (technicalAudit.performance.score < 70) {
      plan.phases[0].actions.push({
        id: 'performance-optimization',
        type: 'technical',
        priority: 'medium',
        description: 'Optimize page performance',
        impact: 'Medium - Improves user experience and SEO',
        effort: 'medium',
        estimatedTime: '2-4 hours',
      });
    }

    // Add security actions
    if (technicalAudit.security.score < 70) {
      plan.phases[0].actions.push({
        id: 'security-hardening',
        type: 'technical',
        priority: 'critical',
        description: 'Address security vulnerabilities',
        impact: 'Critical - Prevents security breaches',
        effort: 'high',
        estimatedTime: '4-8 hours',
      });
    }
  }

  // Add content actions
  if (contentAudit && contentAudit.summary.averageScore < 70) {
    plan.phases.push({
      id: 'content-optimization',
      name: 'Content Optimization',
      description: 'Improve content quality and structure',
      actions: [
        {
          id: 'headline-optimization',
          type: 'content',
          priority: 'medium',
          description: 'Optimize headlines for SEO and engagement',
          impact: 'Medium - Improves click-through rates',
          effort: 'low',
          estimatedTime: '2-3 hours',
        },
        {
          id: 'paragraph-structure',
          type: 'content',
          priority: 'low',
          description: 'Improve paragraph structure and readability',
          impact: 'Low - Minor content improvements',
          effort: 'low',
          estimatedTime: '1-2 hours',
        },
      ],
      estimatedDuration: '1 week',
    });
  }

  // Add recommendations as actions
  if (recommendations) {
    recommendations.forEach((rec, index) => {
      const phase = plan.phases.find(p => p.id === 'foundation') || plan.phases[0];
      phase.actions.push({
        id: `rec-${index}`,
        type: mapCategoryToActionType(rec.category),
        priority: rec.priority,
        description: rec.issue,
        impact: rec.impact,
        effort: rec.effort,
        estimatedTime: estimateTimeFromEffort(rec.effort),
      });
    });
  }

  // Update success metrics
  if (technicalAudit) {
    plan.successMetrics.seoScore = {
      current: technicalAudit.seo.score,
      target: Math.min(100, technicalAudit.seo.score + 20),
    };
  }

  if (contentAudit) {
    plan.successMetrics.sentimentScore = {
      current: contentAudit.summary.averageScore,
      target: Math.min(100, contentAudit.summary.averageScore + 15),
    };
  }

  plan.updatedAt = new Date();
  return plan;
}

/**
 * Build prompt for LLM
 */
function buildPlanPrompt(
  plan: PantheraCanonPlan,
  technicalAudit?: TechnicalAuditResult,
  contentAudit?: ContentAuditResult,
  recommendations?: StructuredRecommendations[]
): string {
  let prompt = `Generate an optimization plan for site ${plan.siteId} (${plan.tier} tier).\n\n`;
  prompt += `Optimization Type: ${plan.optimizationType}\n\n`;
  prompt += `Current Plan Structure:\n${JSON.stringify(plan.phases, null, 2)}\n\n`;

  if (technicalAudit) {
    prompt += `Technical Audit Results:\n`;
    prompt += `- SEO Score: ${technicalAudit.seo.score}/100\n`;
    prompt += `- Performance Score: ${technicalAudit.performance.score}/100\n`;
    prompt += `- Security Score: ${technicalAudit.security.score}/100\n\n`;
  }

  if (contentAudit) {
    prompt += `Content Audit Results:\n`;
    prompt += `- Average Score: ${contentAudit.summary.averageScore}/100\n`;
    prompt += `- Total Issues: ${contentAudit.summary.totalIssues}\n\n`;
  }

  if (recommendations) {
    prompt += `Recommendations:\n${recommendations.map(r => `- [${r.priority}] ${r.issue}: ${r.recommendation}`).join('\n')}\n\n`;
  }

  prompt += `Generate an enhanced, prioritized optimization plan with specific actions, timelines, and success metrics.`;

  return prompt;
}

/**
 * Map category to action type
 */
function mapCategoryToActionType(category: string): 'schema' | 'content' | 'link' | 'technical' | 'semantic' {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('schema') || categoryLower.includes('seo')) {
    return 'schema';
  }
  if (categoryLower.includes('content')) {
    return 'content';
  }
  if (categoryLower.includes('link') || categoryLower.includes('backlink')) {
    return 'link';
  }
  if (categoryLower.includes('performance') || categoryLower.includes('security') || categoryLower.includes('technical')) {
    return 'technical';
  }
  return 'semantic';
}

/**
 * Estimate time from effort level
 */
function estimateTimeFromEffort(effort: 'low' | 'medium' | 'high'): string {
  switch (effort) {
    case 'low':
      return '1-2 hours';
    case 'medium':
      return '2-4 hours';
    case 'high':
      return '4-8 hours';
  }
}
