import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook, verifyWebhookSignature } from '@gpto/billing';

export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/webhook
 * 
 * Stripe webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const body = await request.text();
    
    // Verify webhook signature
    const event = await verifyWebhookSignature(body, signature);
    
    // Handle webhook event
    await handleWebhook(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
