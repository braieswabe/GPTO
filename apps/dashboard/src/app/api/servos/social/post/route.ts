import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { generateSocialPost, schedulePost } from '@gpto/servos-social';

/**
 * POST /api/servos/social/post
 * 
 * Generate or schedule social media post
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { action, topic, platform, tone, scheduledFor } = body;

    if (action === 'generate') {
      if (!topic || !platform) {
        return NextResponse.json(
          { error: 'Missing required fields: topic, platform' },
          { status: 400 }
        );
      }

      const post = await generateSocialPost(topic, platform, tone);
      return NextResponse.json({
        success: true,
        post,
      });
    }

    if (action === 'schedule' && body.post && scheduledFor) {
      const scheduled = schedulePost(body.post, new Date(scheduledFor));
      return NextResponse.json({
        success: true,
        post: scheduled,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error handling social post:', error);
    return NextResponse.json(
      { error: 'Failed to process social post' },
      { status: 500 }
    );
  }
}
