import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { updateSubscription } from '@gpto/billing';

/**
 * POST /api/subscriptions/update
 * 
 * Update subscription tier (upgrade/downgrade)
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
    const { subscriptionId, newTier } = body;

    if (!subscriptionId || !newTier) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, newTier' },
        { status: 400 }
      );
    }

    if (!['bronze', 'silver', 'gold'].includes(newTier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be bronze, silver, or gold' },
        { status: 400 }
      );
    }

    const subscription = await updateSubscription({
      subscriptionId,
      newTier,
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
