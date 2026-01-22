import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { db } from '@gpto/database';
import { competitors } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { scrapeCompetitor, analyzeCompetitor } from '@gpto/competitors';
import { generateSentimentMap, compareCompetitors } from '@gpto/competitors';

/**
 * POST /api/competitors/analyze
 * 
 * Analyze competitors for a site
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required field: siteId' },
        { status: 400 }
      );
    }

    // Get competitors for this site
    const siteCompetitors = await db
      .select()
      .from(competitors)
      .where(eq(competitors.siteId, siteId));

    if (siteCompetitors.length === 0) {
      return NextResponse.json(
        { error: 'No competitors found for this site' },
        { status: 404 }
      );
    }

    // Scrape and analyze each competitor
    const analyses = await Promise.all(
      siteCompetitors.map(async (comp) => {
        try {
          const competitorData = await scrapeCompetitor(comp.domain);
          const analysis = await analyzeCompetitor(competitorData, siteId);
          
          // Update competitor record with analysis data
          await db
            .update(competitors)
            .set({
              telemetryData: analysis.intentSignals as unknown as Record<string, unknown>,
              sentimentData: analysis.sentiment as unknown as Record<string, unknown>,
              lastScrapedAt: new Date(),
            })
            .where(eq(competitors.id, comp.id));

          return analysis;
        } catch (error) {
          console.error(`Error analyzing competitor ${comp.domain}:`, error);
          return null;
        }
      })
    );

    const validAnalyses = analyses.filter((a): a is NonNullable<typeof analyses[0]> => a !== null);

    // Generate sentiment map
    const sentimentMap = generateSentimentMap(validAnalyses);

    // Compare competitors
    const comparison = compareCompetitors(validAnalyses);

    return NextResponse.json({
      success: true,
      analyses: validAnalyses,
      sentimentMap,
      comparison,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error analyzing competitors:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}
