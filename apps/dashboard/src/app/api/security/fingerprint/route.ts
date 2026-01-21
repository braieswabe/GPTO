import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateFingerprint, verifyFingerprint } from '@gpto/security';

/**
 * POST /api/security/fingerprint
 * 
 * Generate or verify cognitive fingerprint
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    const body = await request.json();
    const { action, behaviorPattern, deviceInfo, fingerprint } = body;

    if (action === 'generate') {
      const result = generateFingerprint({
        userId: payload.userId,
        deviceInfo,
        behaviorPattern,
      });

      return NextResponse.json({
        success: true,
        fingerprint: result,
      });
    } else if (action === 'verify') {
      if (!fingerprint) {
        return NextResponse.json(
          { error: 'fingerprint is required for verify action' },
          { status: 400 }
        );
      }

      const isValid = verifyFingerprint(fingerprint, body.threshold || 0.7);

      return NextResponse.json({
        success: true,
        verified: isValid,
        cti: fingerprint.cti,
      });
    } else {
      return NextResponse.json(
        { error: 'action must be "generate" or "verify"' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error processing fingerprint:', error);
    return NextResponse.json(
      { error: 'Failed to process fingerprint' },
      { status: 500 }
    );
  }
}
