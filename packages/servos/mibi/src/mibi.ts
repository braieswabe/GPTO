import { db } from '@gpto/database';
import { telemetryEvents } from '@gpto/database/src/schema';
import { eq, gte, desc } from 'drizzle-orm';

/**
 * MIBI - Market & Business Intelligence
 * Aggregates telemetry to provide actionable insights
 */

export interface IntentHeatmapData {
  intent: string;
  count: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AuthorityDelta {
  siteId: string;
  current: number;
  previous: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  overall: number; // -1 to 1
}

/**
 * Generate intent heatmap from telemetry
 */
export async function generateIntentHeatmap(
  siteId: string,
  days: number = 7
): Promise<IntentHeatmapData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Query telemetry events
  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.siteId, siteId))
    .where(gte(telemetryEvents.timestamp, cutoffDate))
    .orderBy(desc(telemetryEvents.timestamp));

  // Aggregate by intent
  const intentMap = new Map<string, { count: number; scores: number[] }>();

  for (const event of events) {
    const context = event.context as Record<string, unknown> | null;
    const intent = context?.intent as string | undefined;
    const intentScore = (event.metrics as Record<string, number>)?.['ts.intent'] || 0;

    if (intent) {
      const existing = intentMap.get(intent) || { count: 0, scores: [] };
      existing.count++;
      existing.scores.push(intentScore);
      intentMap.set(intent, existing);
    }
  }

  // Convert to heatmap data
  const heatmap: IntentHeatmapData[] = [];
  for (const [intent, data] of intentMap.entries()) {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    heatmap.push({
      intent,
      count: data.count,
      avgScore,
      trend: 'stable', // Would calculate trend in production
    });
  }

  return heatmap.sort((a, b) => b.count - a.count);
}

/**
 * Calculate authority delta
 */
export async function calculateAuthorityDelta(
  siteId: string,
  days: number = 7
): Promise<AuthorityDelta> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const previousCutoff = new Date();
  previousCutoff.setDate(previousCutoff.getDate() - days * 2);

  // Get recent events
  const recentEvents = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.siteId, siteId))
    .where(gte(telemetryEvents.timestamp, cutoffDate));

  // Get previous period events
  const previousEvents = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.siteId, siteId))
    .where(gte(telemetryEvents.timestamp, previousCutoff))
    .where(eq(telemetryEvents.timestamp, cutoffDate));

  const currentAvg =
    recentEvents.reduce((sum, e) => {
      const auth = (e.metrics as Record<string, number>)?.['ts.authority'] || 0;
      return sum + auth;
    }, 0) / (recentEvents.length || 1);

  const previousAvg =
    previousEvents.reduce((sum, e) => {
      const auth = (e.metrics as Record<string, number>)?.['ts.authority'] || 0;
      return sum + auth;
    }, 0) / (previousEvents.length || 1);

  const delta = currentAvg - previousAvg;

  return {
    siteId,
    current: currentAvg,
    previous: previousAvg,
    delta,
    trend: delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'stable',
  };
}

/**
 * Analyze sentiment from telemetry
 */
export async function analyzeSentiment(
  siteId: string,
  days: number = 7
): Promise<SentimentAnalysis> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.siteId, siteId))
    .where(gte(telemetryEvents.timestamp, cutoffDate));

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const event of events) {
    const sentiment = (event.metrics as Record<string, number>)?.['ts.sentiment'] || 0.5;
    if (sentiment > 0.6) {
      positive++;
    } else if (sentiment < 0.4) {
      negative++;
    } else {
      neutral++;
    }
  }

  const total = events.length || 1;
  const overall = (positive - negative) / total;

  return {
    positive: positive / total,
    negative: negative / total,
    neutral: neutral / total,
    overall,
  };
}
