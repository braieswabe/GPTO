import { callLLM } from '@gpto/api-lattice';
import type { TechnicalAuditResult } from './technical-audit';
import type { ContentAuditResult } from './content-audit';
import type { LLMProvider } from '@gpto/api-lattice';

export interface StructuredRecommendations {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Generate structured recommendations from audit results
 */
export async function generateStructuredRecommendations(
  technicalAudit: TechnicalAuditResult,
  contentAudit?: ContentAuditResult
): Promise<StructuredRecommendations[]> {
  const recommendations: StructuredRecommendations[] = [];

  // Process technical audit results
  if (technicalAudit.security.score < 70) {
    recommendations.push({
      priority: 'critical',
      category: 'Security',
      issue: 'Security score below threshold',
      recommendation: 'Implement HTTPS, add Content-Security-Policy headers, and review inline scripts',
      impact: 'High - Security vulnerabilities can lead to data breaches',
      effort: 'medium',
    });
  }

  if (technicalAudit.aiSearchOptimization.score < 50) {
    recommendations.push({
      priority: 'critical',
      category: 'AI Search Optimization',
      issue: 'Critical AI Search Optimization issues detected',
      recommendation: technicalAudit.aiSearchOptimization.recommendations.join('; ') || 'Address missing AI optimization elements',
      impact: 'High - Significant impact on AI search visibility (ChatGPT, Perplexity, Claude)',
      effort: 'low',
    });
  }

  technicalAudit.aiSearchOptimization.issues.forEach(issue => {
    recommendations.push({
      priority: issue.includes('Missing') || issue.includes('not found') || issue.includes('not configured') ? 'high' : 'medium',
      category: 'AI Search Optimization',
      issue,
      recommendation: getRecommendationForIssue(issue),
      impact: 'Medium - Affects AI search engine visibility and comprehension',
      effort: 'low',
    });
  });

  technicalAudit.performance.issues.forEach(issue => {
    recommendations.push({
      priority: 'medium',
      category: 'Performance',
      issue,
      recommendation: getRecommendationForIssue(issue),
      impact: 'Medium - Affects user experience and page speed',
      effort: 'medium',
    });
  });

  technicalAudit.accessibility.issues.forEach(issue => {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      issue,
      recommendation: getRecommendationForIssue(issue),
      impact: 'Medium - Affects accessibility compliance',
      effort: 'low',
    });
  });

  // Process content audit if available
  if (contentAudit) {
    contentAudit.reviews.forEach(review => {
      review.headline.issues.forEach(issue => {
        recommendations.push({
          priority: 'medium',
          category: 'Content',
          issue: `Headline: ${issue}`,
          recommendation: review.headline.recommendations.join('; ') || 'Improve headline',
          impact: 'Medium - Affects engagement and AI search visibility',
          effort: 'low',
        });
      });

      review.paragraphs.forEach((para, index) => {
        para.issues.forEach(issue => {
          recommendations.push({
            priority: 'low',
            category: 'Content',
            issue: `Paragraph ${index + 1}: ${issue}`,
            recommendation: 'Review and optimize paragraph structure',
            impact: 'Low - Minor content improvements',
            effort: 'low',
          });
        });
      });
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Get recommendation for a specific issue
 */
function getRecommendationForIssue(issue: string): string {
  const issueLower = issue.toLowerCase();

  if (issueLower.includes('missing title')) {
    return 'Add a descriptive <title> tag (30-60 characters)';
  }
  if (issueLower.includes('missing meta description')) {
    return 'Add meta description tag (150-160 characters)';
  }
  if (issueLower.includes('missing h1')) {
    return 'Add H1 heading to main content area';
  }
  if (issueLower.includes('alt')) {
    return 'Add descriptive alt attributes to all images';
  }
  if (issueLower.includes('json-ld') || issueLower.includes('schema')) {
    return 'Implement JSON-LD structured data';
  }
  if (issueLower.includes('https')) {
    return 'Migrate site to HTTPS';
  }
  if (issueLower.includes('size') || issueLower.includes('large')) {
    return 'Optimize HTML size by minifying and removing unnecessary code';
  }
  if (issueLower.includes('inline')) {
    return 'Move inline styles/scripts to external files';
  }
  if (issueLower.includes('lang')) {
    return 'Add lang attribute to <html> tag';
  }

  return 'Review and address the issue';
}
