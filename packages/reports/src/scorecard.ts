import type { TechnicalAuditResult, SiteAuditResult } from '@gpto/audit';
import type { ContentAuditResult } from '@gpto/audit';
import type { StructuredRecommendations } from '@gpto/audit';

export interface Scorecard {
  siteId: string;
  tier: string;
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
  generatedAt: Date;
}

type ScorecardInput =
  | TechnicalAuditResult
  | SiteAuditResult
  | { technical?: TechnicalAuditResult; siteAudit?: SiteAuditResult };

/**
 * Generate scorecard from audit results
 */
export function generateScorecard(
  siteId: string,
  tier: string,
  auditInput: ScorecardInput,
  contentAudit?: ContentAuditResult,
  recommendations?: StructuredRecommendations[] | Record<string, unknown>
): Scorecard {
  const siteAudit = extractSiteAudit(auditInput);
  const technicalAudit = extractTechnicalAudit(auditInput);

  let categoryScores: Scorecard['categoryScores'] = {};
  let overallScore = 0;

  if (siteAudit) {
    categoryScores = {
      aiReadiness: siteAudit.scores.aiReadiness,
      structure: siteAudit.scores.structure,
      contentDepth: siteAudit.scores.contentDepth,
      technicalReadiness: siteAudit.scores.technicalReadiness,
    };
    overallScore = siteAudit.scores.overall;
  } else if (technicalAudit) {
    categoryScores = {
      schema: technicalAudit.schema.present ? 100 : 0,
      performance: technicalAudit.performance.score,
      seo: technicalAudit.seo.score,
      accessibility: technicalAudit.accessibility.score,
      security: technicalAudit.security.score,
      content: contentAudit ? contentAudit.summary.averageScore : undefined,
    };

    const weights = {
      schema: 0.1,
      performance: 0.15,
      seo: 0.3,
      accessibility: 0.1,
      security: 0.25,
      content: 0.1,
    };

    let totalWeight = weights.schema + weights.performance + weights.seo + weights.accessibility + weights.security;
    let weightedSum =
      (categoryScores.schema ?? 0) * weights.schema +
      (categoryScores.performance ?? 0) * weights.performance +
      (categoryScores.seo ?? 0) * weights.seo +
      (categoryScores.accessibility ?? 0) * weights.accessibility +
      (categoryScores.security ?? 0) * weights.security;

    if (categoryScores.content !== undefined) {
      totalWeight += weights.content;
      weightedSum += categoryScores.content * weights.content;
    }

    overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  const recCounts = countRecommendations(recommendations);

  return {
    siteId,
    tier,
    overallScore: Math.round(overallScore),
    categoryScores,
    recommendations: recCounts,
    generatedAt: new Date(),
  };
}

/**
 * Format scorecard as JSON
 */
export function formatScorecardJSON(scorecard: Scorecard): string {
  return JSON.stringify(scorecard, null, 2);
}

/**
 * Format scorecard as HTML
 */
export function formatScorecardHTML(scorecard: Scorecard): string {
  const scoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const formatLabel = (category: string) => {
    const map: Record<string, string> = {
      aiReadiness: 'AI Readiness',
      contentDepth: 'Content Depth',
      technicalReadiness: 'Technical Readiness',
      aiSearchOptimization: 'AI Search Optimization',
      structure: 'Structure',
      schema: 'Schema',
      performance: 'Performance',
      accessibility: 'Accessibility',
      security: 'Security',
      content: 'Content',
      seo: 'SEO',
    };
    if (map[category]) return map[category];
    return category.replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GPTO Scorecard - ${scorecard.siteId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .meta { color: #6b7280; margin-bottom: 30px; }
    .overall-score { font-size: 48px; font-weight: bold; color: ${scoreColor(scorecard.overallScore)}; margin: 20px 0; }
    .category { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 4px; }
    .category-name { font-weight: bold; margin-bottom: 5px; }
    .score-bar { height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
    .score-fill { height: 100%; background: ${scoreColor(scorecard.overallScore)}; transition: width 0.3s; }
    .recommendations { margin-top: 30px; }
    .rec-item { padding: 10px; margin: 5px 0; border-left: 4px solid #3b82f6; background: #eff6ff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GPTO Scorecard</h1>
    <div class="meta">
      Site ID: ${scorecard.siteId}<br>
      Tier: ${scorecard.tier}<br>
      Generated: ${scorecard.generatedAt.toLocaleString()}
    </div>
    
    <div class="overall-score">${scorecard.overallScore}/100</div>
    
    <h2>Category Scores</h2>
    ${Object.entries(scorecard.categoryScores)
      .filter(([_, score]) => score !== undefined)
      .map(([category, score]) => `
        <div class="category">
          <div class="category-name">${formatLabel(category)}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${score}%; background: ${scoreColor(score as number)};"></div>
          </div>
          <div>${score}/100</div>
        </div>
      `).join('')}
    
    <div class="recommendations">
      <h2>Recommendations Summary</h2>
      <div class="rec-item">Critical: ${scorecard.recommendations.critical}</div>
      <div class="rec-item">High: ${scorecard.recommendations.high}</div>
      <div class="rec-item">Medium: ${scorecard.recommendations.medium}</div>
      <div class="rec-item">Low: ${scorecard.recommendations.low}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function extractSiteAudit(input: ScorecardInput): SiteAuditResult | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const maybeCombined = input as { siteAudit?: SiteAuditResult };
  if (maybeCombined.siteAudit?.scores?.aiReadiness !== undefined) {
    return maybeCombined.siteAudit;
  }
  const maybeSite = input as SiteAuditResult;
  if (maybeSite.scores?.aiReadiness !== undefined) {
    return maybeSite;
  }
  return undefined;
}

function extractTechnicalAudit(input: ScorecardInput): TechnicalAuditResult | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const maybeCombined = input as { technical?: TechnicalAuditResult };
  if (maybeCombined.technical?.performance) {
    return maybeCombined.technical;
  }
  const maybeTechnical = input as TechnicalAuditResult;
  if (maybeTechnical.performance) {
    return maybeTechnical;
  }
  return undefined;
}

function countRecommendations(
  recommendations?: StructuredRecommendations[] | Record<string, unknown>
): Scorecard['recommendations'] {
  const recCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  if (!recommendations) return recCounts;

  if (Array.isArray(recommendations)) {
    recommendations.forEach(rec => {
      recCounts[rec.priority]++;
    });
  } else if (typeof recommendations === 'object') {
    const asAny = recommendations as Record<string, unknown>;
    recCounts.critical = Array.isArray(asAny.critical) ? (asAny.critical as unknown[]).length : 0;
    recCounts.high = Array.isArray(asAny.high) ? (asAny.high as unknown[]).length : 0;
    recCounts.medium = Array.isArray(asAny.medium) ? (asAny.medium as unknown[]).length : 0;
    recCounts.low = Array.isArray(asAny.low) ? (asAny.low as unknown[]).length : 0;
  }

  return recCounts;
}
