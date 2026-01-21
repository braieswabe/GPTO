import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateIntentHeatmap, calculateAuthorityDelta, analyzeSentiment } from '@gpto/servos-mibi';
import { generateInsights } from '@gpto/servos-mibi/src/insights';

/**
 * GET /api/servos/mibi/insights
 * 
 * Get MIBI intelligence insights
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 }
      );
    }

    // Generate insights
    const [heatmap, authorityDelta, sentiment] = await Promise.all([
      generateIntentHeatmap(siteId, days),
      calculateAuthorityDelta(siteId, days),
      analyzeSentiment(siteId, days),
    ]);

    const insights = generateInsights(heatmap, authorityDelta, sentiment);

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        authorityDelta,
        sentiment,
        insights,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating MIBI insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
