import { analyzeSentiment } from '@gpto/servos-mibi';
import type { CompetitorData } from './scraper';

export interface IntentSignal {
  keyword: string;
  score: number;
  context: string;
}

export interface CompetitorAnalysis {
  domain: string;
  intentSignals: IntentSignal[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    overall: number;
  };
  authorityIndicators: {
    backlinkCount?: number;
    domainAge?: number;
    schemaTypes: string[];
  };
  contentMetrics: {
    wordCount: number;
    headingCount: number;
    linkCount: number;
  };
}

/**
 * Analyze intent signals from competitor data
 */
export function analyzeIntent(competitorData: CompetitorData): IntentSignal[] {
  const intentSignals: IntentSignal[] = [];
  
  // Extract keywords from headings and content
  const allText = [
    competitorData.title,
    competitorData.description,
    ...competitorData.headings,
    competitorData.content.substring(0, 5000), // First 5000 chars
  ].join(' ').toLowerCase();

  // Simple keyword extraction (would use NLP in production)
  const words = allText.split(/\s+/).filter(w => w.length > 4);
  const wordFreq = new Map<string, number>();

  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Get top keywords
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  sortedWords.forEach(([keyword, count]) => {
    intentSignals.push({
      keyword,
      score: Math.min(count / 10, 1.0), // Normalize to 0-1
      context: competitorData.headings.find(h => h.toLowerCase().includes(keyword)) || '',
    });
  });

  return intentSignals;
}

/**
 * Analyze sentiment from competitor data
 */
export async function analyzeCompetitorSentiment(
  competitorData: CompetitorData,
  siteId: string
): Promise<{ positive: number; negative: number; neutral: number; overall: number }> {
  // Use MIBI sentiment analysis
  // For competitor analysis, we'll create synthetic telemetry events
  // In production, this would be more sophisticated
  
  const content = [
    competitorData.title,
    competitorData.description,
    ...competitorData.headings.slice(0, 5),
  ].join(' ');

  // Simple sentiment scoring based on positive/negative words
  // In production, would use actual ML model
  const positiveWords = ['best', 'great', 'excellent', 'amazing', 'top', 'quality', 'premium'];
  const negativeWords = ['worst', 'bad', 'poor', 'terrible', 'cheap', 'low'];

  let positiveScore = 0;
  let negativeScore = 0;
  const contentLower = content.toLowerCase();

  positiveWords.forEach(word => {
    if (contentLower.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (contentLower.includes(word)) negativeScore++;
  });

  const total = positiveScore + negativeScore || 1;
  const positive = positiveScore / total;
  const negative = negativeScore / total;
  const neutral = 1 - positive - negative;
  const overall = positive - negative;

  return {
    positive,
    negative,
    neutral,
    overall,
  };
}

/**
 * Analyze competitor authority indicators
 */
export function analyzeAuthority(competitorData: CompetitorData): {
  backlinkCount?: number;
  domainAge?: number;
  schemaTypes: string[];
} {
  const schemaTypes: string[] = [];

  // Extract schema types from JSON-LD
  competitorData.schemaData?.forEach(schema => {
    if (typeof schema === 'object' && schema !== null) {
      const schemaObj = schema as Record<string, unknown>;
      if ('@type' in schemaObj && typeof schemaObj['@type'] === 'string') {
        schemaTypes.push(schemaObj['@type']);
      }
    }
  });

  // In production, would fetch backlink count and domain age from APIs
  return {
    schemaTypes: [...new Set(schemaTypes)],
  };
}

/**
 * Perform full competitor analysis
 */
export async function analyzeCompetitor(
  competitorData: CompetitorData,
  siteId: string
): Promise<CompetitorAnalysis> {
  const intentSignals = analyzeIntent(competitorData);
  const sentiment = await analyzeCompetitorSentiment(competitorData, siteId);
  const authorityIndicators = analyzeAuthority(competitorData);

  return {
    domain: competitorData.domain,
    intentSignals,
    sentiment,
    authorityIndicators,
    contentMetrics: {
      wordCount: competitorData.content.split(/\s+/).length,
      headingCount: competitorData.headings.length,
      linkCount: competitorData.links.length,
    },
  };
}
