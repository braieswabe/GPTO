import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@gpto/api';

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
