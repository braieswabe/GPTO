import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { securitySessions } from '@gpto/database/src/schema';
import { generateToken } from '@gpto/api';
import jwt from 'jsonwebtoken';
import { generateFingerprint } from '@gpto/security';

/**
 * POST /api/auth/dev-token
 * 
 * Generate a development token (for development/testing only)
 * This endpoint should be disabled in production!
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId = 'dev-user-123', email = 'dev@example.com', role = 'admin', tenantId } = body;

    const token = generateToken({
      userId,
      email,
      role,
      tenantId,
    });

    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const fingerprintValue = generateFingerprint({ userId });
      await db.insert(securitySessions).values({
        userId,
        fingerprint: JSON.stringify(fingerprintValue),
        token,
        expiresAt,
      });
    } catch (sessionError) {
      console.error('Failed to log dev security session:', sessionError);
    }

    return NextResponse.json({
      success: true,
      token,
      payload: {
        userId,
        email,
        role,
        tenantId,
      },
    });
  } catch (error) {
    console.error('Error generating dev token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
