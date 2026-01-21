import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateIntentHeatmap } from '@gpto/servos-mibi';

/**
 * GET /api/servos/mibi/heatmap
 * 
 * Get intent heatmap
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

    const heatmap = await generateIntentHeatmap(siteId, days);

    return NextResponse.json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating heatmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate heatmap' },
      { status: 500 }
    );
  }
}
