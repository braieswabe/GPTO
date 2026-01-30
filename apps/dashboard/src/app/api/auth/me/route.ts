import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { securitySessions, users } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { generateFingerprint, CognitiveFingerprint } from '@gpto/security';

/**
 * GET /api/auth/me
 * 
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    // Fetch user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const [existingSession] = await db
      .select({ id: securitySessions.id })
      .from(securitySessions)
      .where(eq(securitySessions.token, token))
      .limit(1);

    if (!existingSession) {
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const userAgent = request.headers.get('user-agent') || undefined;
        const fingerprintValue: CognitiveFingerprint = generateFingerprint({
          userId: user.id,
          deviceInfo: userAgent,
        });

        await db.insert(securitySessions).values({
          userId: user.id,
          fingerprint: JSON.stringify(fingerprintValue),
          token,
          expiresAt,
        });
      } catch (sessionError) {
        console.error('Failed to log security session:', sessionError);
      }
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
