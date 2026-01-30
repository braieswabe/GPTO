import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { securitySessions, users } from '@gpto/database/src/schema';
import { generateToken, verifyPassword } from '@gpto/api';
import { AuthenticationError, ValidationError } from '@gpto/api/src/errors';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { generateFingerprint, CognitiveFingerprint } from '@gpto/security';

/**
 * POST /api/auth/login
 * 
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fingerprint, deviceInfo, behaviorPattern } = body;

    // Validation
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required');
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    try {
      const isValidPassword = verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
      }
    } catch (verifyError) {
      // Log password verification errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Password verification error:', verifyError);
        console.error('Password hash format:', user.passwordHash?.substring(0, 50) + '...');
      }
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
    });

    // Log security session (non-blocking)
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      let fingerprintValue: CognitiveFingerprint | null = null;
      if (fingerprint && typeof fingerprint === 'object') {
        fingerprintValue = fingerprint as CognitiveFingerprint;
      } else {
        const userAgent = request.headers.get('user-agent') || undefined;
        fingerprintValue = generateFingerprint({
          userId: user.id,
          deviceInfo: deviceInfo || userAgent,
          behaviorPattern,
        });
      }

      await db.insert(securitySessions).values({
        userId: user.id,
        fingerprint: fingerprintValue ? JSON.stringify(fingerprintValue) : null,
        token,
        expiresAt,
      });
    } catch (sessionError) {
      console.error('Failed to log security session:', sessionError);
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error during login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { error: 'Failed to login', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}
