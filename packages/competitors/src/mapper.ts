import type { CompetitorAnalysis } from './analyzer';

export interface SentimentMap {
  competitors: Array<{
    domain: string;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
      overall: number;
    };
    position: {
      x: number;
      y: number;
    };
  }>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Generate sentiment map for visualization
 */
export function generateSentimentMap(competitors: CompetitorAnalysis[]): SentimentMap {
  if (competitors.length === 0) {
    return {
      competitors: [],
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    };
  }

  // Map competitors to 2D space based on sentiment scores
  // X-axis: overall sentiment (-1 to 1)
  // Y-axis: positive sentiment (0 to 1)
  const mapped = competitors.map((comp, index) => {
    // Normalize to 0-1 range for X (from -1 to 1)
    const x = (comp.sentiment.overall + 1) / 2;
    const y = comp.sentiment.positive;

    return {
      domain: comp.domain,
      sentiment: comp.sentiment,
      position: { x, y },
    };
  });

  const xs = mapped.map(c => c.position.x);
  const ys = mapped.map(c => c.position.y);

  return {
    competitors: mapped,
    bounds: {
      minX: Math.min(...xs, 0),
      maxX: Math.max(...xs, 1),
      minY: Math.min(...ys, 0),
      maxY: Math.max(...ys, 1),
    },
  };
}

/**
 * Compare competitor metrics
 */
export function compareCompetitors(competitors: CompetitorAnalysis[]): {
  topIntentKeywords: Array<{ keyword: string; frequency: number }>;
  averageSentiment: number;
  schemaTypeFrequency: Record<string, number>;
} {
  // Aggregate intent keywords
  const keywordFreq = new Map<string, number>();
  competitors.forEach(comp => {
    comp.intentSignals.forEach(signal => {
      keywordFreq.set(signal.keyword, (keywordFreq.get(signal.keyword) || 0) + signal.score);
    });
  });

  const topIntentKeywords = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, frequency]) => ({ keyword, frequency }));

  // Calculate average sentiment
  const averageSentiment =
    competitors.reduce((sum, comp) => sum + comp.sentiment.overall, 0) / competitors.length;

  // Aggregate schema types
  const schemaTypeFreq: Record<string, number> = {};
  competitors.forEach(comp => {
    comp.authorityIndicators.schemaTypes.forEach(type => {
      schemaTypeFreq[type] = (schemaTypeFreq[type] || 0) + 1;
    });
  });

  return {
    topIntentKeywords,
    averageSentiment,
    schemaTypeFrequency: schemaTypeFreq,
  };
}
