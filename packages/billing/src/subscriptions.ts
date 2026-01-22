import { db } from '@gpto/database';
import { subscriptions } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { createStripeSubscription, updateStripeSubscription, cancelStripeSubscription, TIER_PRICES } from './stripe';
import type { Stripe } from 'stripe';

export type SubscriptionTier = 'bronze' | 'silver' | 'gold';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export interface CreateSubscriptionParams {
  siteId: string;
  tier: SubscriptionTier;
  stripeCustomerId: string;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newTier: SubscriptionTier;
}

/**
 * Create a subscription in the database and Stripe
 */
export async function createSubscription(params: CreateSubscriptionParams): Promise<typeof subscriptions.$inferSelect> {
  const { siteId, tier, stripeCustomerId, paymentMethodId } = params;
  
  const priceId = TIER_PRICES[tier];
  if (!priceId) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Create Stripe subscription
  const stripeSubscription = await createStripeSubscription(stripeCustomerId, priceId, paymentMethodId);

  // Calculate period dates
  const currentPeriodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days

  // Create database record
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      siteId,
      tier,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      status: 'active',
      currentPeriodStart,
      currentPeriodEnd,
    })
    .returning();

  return subscription;
}

/**
 * Update subscription tier (upgrade/downgrade)
 */
export async function updateSubscription(params: UpdateSubscriptionParams): Promise<typeof subscriptions.$inferSelect> {
  const { subscriptionId, newTier } = params;

  // Get current subscription from database
  const [currentSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId));

  if (!currentSub || !currentSub.stripeSubscriptionId) {
    throw new Error('Subscription not found');
  }

  const newPriceId = TIER_PRICES[newTier];
  if (!newPriceId) {
    throw new Error(`Invalid tier: ${newTier}`);
  }

  // Update Stripe subscription
  const stripeSubscription = await updateStripeSubscription(currentSub.stripeSubscriptionId, newPriceId);

  // Update database record
  const currentPeriodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : currentSub.currentPeriodStart;
  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : currentSub.currentPeriodEnd;

  const [updated] = await db
    .update(subscriptions)
    .set({
      tier: newTier,
      currentPeriodStart,
      currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  return updated;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<typeof subscriptions.$inferSelect> {
  // Get current subscription from database
  const [currentSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId));

  if (!currentSub || !currentSub.stripeSubscriptionId) {
    throw new Error('Subscription not found');
  }

  // Cancel Stripe subscription
  await cancelStripeSubscription(currentSub.stripeSubscriptionId, immediately);

  // Update database record
  const [updated] = await db
    .update(subscriptions)
    .set({
      status: immediately ? 'cancelled' : 'active', // If not immediate, will cancel at period end
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  return updated;
}

/**
 * Get subscription by site ID
 */
export async function getSubscriptionBySiteId(siteId: string): Promise<typeof subscriptions.$inferSelect | null> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.siteId, siteId))
    .limit(1);

  return subscription || null;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<typeof subscriptions.$inferSelect | null> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  return subscription || null;
}

/**
 * Update subscription status from Stripe webhook
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date
): Promise<typeof subscriptions.$inferSelect> {
  const updateData: Partial<typeof subscriptions.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (currentPeriodStart) {
    updateData.currentPeriodStart = currentPeriodStart;
  }
  if (currentPeriodEnd) {
    updateData.currentPeriodEnd = currentPeriodEnd;
  }

  const [updated] = await db
    .update(subscriptions)
    .set(updateData)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();

  if (!updated) {
    throw new Error(`Subscription not found: ${stripeSubscriptionId}`);
  }

  return updated;
}
