import type { TechnicalAuditResult } from '@gpto/audit';
import type { ContentAuditResult } from '@gpto/audit';
import type { StructuredRecommendations } from '@gpto/audit';

export interface Scorecard {
  siteId: string;
  tier: string;
  overallScore: number;
  categoryScores: {
    schema: number;
    performance: number;
    seo: number;
    accessibility: number;
    security: number;
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

/**
 * Generate scorecard from audit results
 */
export function generateScorecard(
  siteId: string,
  tier: string,
  technicalAudit: TechnicalAuditResult,
  contentAudit?: ContentAuditResult,
  recommendations?: StructuredRecommendations[]
): Scorecard {
  // Calculate category scores
  const categoryScores = {
    schema: technicalAudit.schema.present ? 100 : 0,
    performance: technicalAudit.performance.score,
    seo: technicalAudit.seo.score,
    accessibility: technicalAudit.accessibility.score,
    security: technicalAudit.security.score,
    content: contentAudit ? contentAudit.summary.averageScore : undefined,
  };

  // Calculate overall score (weighted average)
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
    categoryScores.schema * weights.schema +
    categoryScores.performance * weights.performance +
    categoryScores.seo * weights.seo +
    categoryScores.accessibility * weights.accessibility +
    categoryScores.security * weights.security;

  if (categoryScores.content !== undefined) {
    totalWeight += weights.content;
    weightedSum += categoryScores.content * weights.content;
  }

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Count recommendations by priority
  const recCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  if (recommendations) {
    recommendations.forEach(rec => {
      recCounts[rec.priority]++;
    });
  }

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
    .score-fill { height: 100%; background: ${scoreColor(scorecard.categoryScores.seo)}; transition: width 0.3s; }
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
          <div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
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
