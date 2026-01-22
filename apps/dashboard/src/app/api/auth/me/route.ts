import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { users } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { eq } from 'drizzle-orm';

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
