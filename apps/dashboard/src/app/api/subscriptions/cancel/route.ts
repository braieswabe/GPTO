import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { cancelSubscription } from '@gpto/billing';

/**
 * POST /api/subscriptions/cancel
 * 
 * Cancel a subscription
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
    const { subscriptionId, immediately } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    const subscription = await cancelSubscription(subscriptionId, immediately || false);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
