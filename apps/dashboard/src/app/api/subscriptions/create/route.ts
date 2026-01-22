import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { createSubscription, createCustomer } from '@gpto/billing';

/**
 * POST /api/subscriptions/create
 * 
 * Create a new subscription
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
    const { siteId, tier, email, paymentMethodId } = body;

    if (!siteId || !tier || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, tier, email' },
        { status: 400 }
      );
    }

    if (!['bronze', 'silver', 'gold'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be bronze, silver, or gold' },
        { status: 400 }
      );
    }

    // Create Stripe customer
    const customer = await createCustomer(email, { siteId });

    // Create subscription
    const subscription = await createSubscription({
      siteId,
      tier,
      stripeCustomerId: customer.id,
      paymentMethodId,
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
