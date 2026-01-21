/**
 * MIBI Insights generation
 */

export interface MIBIInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
  metrics?: Record<string, number>;
}

/**
 * Generate insights from telemetry data
 */
export function generateInsights(
  heatmap: Array<{ intent: string; count: number; avgScore: number }>,
  authorityDelta: { delta: number; trend: string },
  sentiment: { overall: number }
): MIBIInsight[] {
  const insights: MIBIInsight[] = [];

  // Authority trend insight
  if (authorityDelta.delta < -0.1) {
    insights.push({
      type: 'warning',
      title: 'Authority Score Declining',
      description: `Authority has decreased by ${(authorityDelta.delta * 100).toFixed(1)}% over the last period.`,
      severity: 'high',
      actionable: true,
      action: 'Review content quality and backlink strategy',
      metrics: { delta: authorityDelta.delta },
    });
  } else if (authorityDelta.delta > 0.1) {
    insights.push({
      type: 'trend',
      title: 'Authority Score Improving',
      description: `Authority has increased by ${(authorityDelta.delta * 100).toFixed(1)}%.`,
      severity: 'low',
      actionable: false,
      metrics: { delta: authorityDelta.delta },
    });
  }

  // Sentiment insight
  if (sentiment.overall < -0.2) {
    insights.push({
      type: 'warning',
      title: 'Negative Sentiment Detected',
      description: 'Overall sentiment is trending negative. Consider reputation management.',
      severity: 'medium',
      actionable: true,
      action: 'Review recent content and address concerns',
      metrics: { sentiment: sentiment.overall },
    });
  }

  // Intent opportunity
  const topIntent = heatmap[0];
  if (topIntent && topIntent.count > 10 && topIntent.avgScore > 0.7) {
    insights.push({
      type: 'opportunity',
      title: 'High-Intent Opportunity',
      description: `"${topIntent.intent}" shows strong intent signals. Consider creating targeted content.`,
      severity: 'low',
      actionable: true,
      action: `Create content targeting: ${topIntent.intent}`,
      metrics: { count: topIntent.count, score: topIntent.avgScore },
    });
  }

  return insights;
}
