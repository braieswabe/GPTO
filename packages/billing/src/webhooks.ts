import { stripe } from './stripe';
import { updateSubscriptionStatus } from './subscriptions';
import type { Stripe } from 'stripe';

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancellation(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

/**
 * Handle subscription update (created or updated)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const status = mapStripeStatusToDbStatus(subscription.status);
  const currentPeriodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000)
    : undefined;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : undefined;

  await updateSubscriptionStatus(subscription.id, status, currentPeriodStart, currentPeriodEnd);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
  await updateSubscriptionStatus(subscription.id, 'cancelled');
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await handleSubscriptionUpdate(subscription);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    await updateSubscriptionStatus(invoice.subscription, 'past_due');
  }
}

/**
 * Map Stripe subscription status to database status
 */
function mapStripeStatusToDbStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'cancelled' | 'past_due' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    case 'past_due':
    case 'incomplete':
    case 'incomplete_expired':
      return 'past_due';
    default:
      return 'active';
  }
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
