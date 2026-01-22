import Stripe from 'stripe';

/**
 * Get Stripe client instance (lazy initialization)
 * Only initializes when actually needed at runtime, not during build
 */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

/**
 * Stripe client instance (lazy getter)
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

/**
 * Tier pricing configuration
 */
export const TIER_PRICES: Record<string, string> = {
  bronze: process.env.STRIPE_PRICE_ID_BRONZE || 'price_bronze_monthly',
  silver: process.env.STRIPE_PRICE_ID_SILVER || 'price_silver_monthly',
  gold: process.env.STRIPE_PRICE_ID_GOLD || 'price_gold_monthly',
};

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    metadata,
  });
}

/**
 * Create a Stripe subscription
 */
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  paymentMethodId?: string
): Promise<Stripe.Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  };

  if (paymentMethodId) {
    subscriptionData.default_payment_method = paymentMethodId;
  }

  return await stripe.subscriptions.create(subscriptionData);
}

/**
 * Update a Stripe subscription (upgrade/downgrade)
 */
export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Retrieve a Stripe subscription
 */
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}
