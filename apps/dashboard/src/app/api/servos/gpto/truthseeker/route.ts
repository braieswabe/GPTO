import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { applyTruthSeeker } from '@gpto/servos-gpto';

/**
 * POST /api/servos/gpto/truthseeker
 * 
 * Apply TruthSeeker re-ranking to content items
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
    const { items, query, config } = body;

    if (!items || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: items, query' },
        { status: 400 }
      );
    }

    const result = applyTruthSeeker(items, query, config);

    // Convert Map to object for JSON serialization
    const scoresObj: Record<string, number> = {};
    result.scores.forEach((value, key) => {
      scoresObj[key] = value;
    });

    const explanationsObj: Record<string, string> = {};
    result.explanations.forEach((value, key) => {
      explanationsObj[key] = value;
    });

    return NextResponse.json({
      success: true,
      ranked: result.ranked,
      scores: scoresObj,
      explanations: explanationsObj,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error applying TruthSeeker:', error);
    return NextResponse.json(
      { error: 'Failed to apply TruthSeeker' },
      { status: 500 }
    );
  }
}
