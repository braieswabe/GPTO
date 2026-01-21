import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateAGCCContent } from '@gpto/servos-agcc';

/**
 * POST /api/servos/agcc/generate
 * 
 * Generate content using AGCC
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { contentType, topic, tone, targetAudience, constraints, cognitiveFingerprint } = body;

    if (!contentType || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, topic' },
        { status: 400 }
      );
    }

    const result = await generateAGCCContent({
      contentType,
      topic,
      tone,
      targetAudience,
      constraints,
      cognitiveFingerprint,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating AGCC content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
