import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateContent } from '@gpto/servos-gpto';

/**
 * POST /api/servos/gpto/generate
 * 
 * Generate content or schema using GPTO
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
    const { type, topic, tone, targetAudience, constraints, siteId, config } = body;

    if (!type || !topic || !siteId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: type, topic, siteId, config' },
        { status: 400 }
      );
    }

    const result = await generateContent(
      {
        type,
        topic,
        tone,
        targetAudience,
        constraints,
      },
      {
        siteId,
        config,
      }
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
