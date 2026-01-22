import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * Logout endpoint (client-side token removal)
 * In a more advanced setup, you might invalidate tokens server-side
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
