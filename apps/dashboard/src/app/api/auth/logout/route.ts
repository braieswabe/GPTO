import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { securitySessions } from '@gpto/database/src/schema';
import { extractToken } from '@gpto/api';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/logout
 * 
 * Logout endpoint (client-side token removal)
 * In a more advanced setup, you might invalidate tokens server-side
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader ?? undefined);

  if (token) {
    try {
      await db.delete(securitySessions).where(eq(securitySessions.token, token));
    } catch (error) {
      console.error('Failed to delete security session:', error);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
