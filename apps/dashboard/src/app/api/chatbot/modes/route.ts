import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { UserMode } from '@gpto/servos-chatbot';

/**
 * POST /api/chatbot/modes
 * 
 * Switch chatbot mode
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
    const { mode } = body;

    const validModes: UserMode[] = ['ask', 'plan', 'do', 'audit', 'explain', 'teach', 'simulate', 'benchmark'];
    
    if (!mode || !validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    // In production, this would update session state
    return NextResponse.json({
      success: true,
      mode,
      message: `Switched to ${mode} mode`,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error switching mode:', error);
    return NextResponse.json(
      { error: 'Failed to switch mode' },
      { status: 500 }
    );
  }
}
