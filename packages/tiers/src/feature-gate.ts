import { getSubscriptionBySiteId } from '@gpto/billing';
import { getTierFeatures, tierSupportsSchemaType, tierSupportsFeature, getCompetitorLimit } from './tier-config';
import type { SubscriptionTier } from '@gpto/billing';
import type { SchemaType } from './tier-config';

export interface FeatureGateResult {
  allowed: boolean;
  tier?: SubscriptionTier;
  reason?: string;
}

/**
 * Check if site has access to a feature
 */
export async function checkFeatureAccess(
  siteId: string,
  feature: keyof ReturnType<typeof getTierFeatures>
): Promise<FeatureGateResult> {
  const subscription = await getSubscriptionBySiteId(siteId);

  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      reason: 'No active subscription found',
    };
  }

  const tier = subscription.tier as SubscriptionTier;
  const hasFeature = tierSupportsFeature(tier, feature);

  return {
    allowed: hasFeature,
    tier,
    reason: hasFeature ? undefined : `Feature not available in ${tier} tier`,
  };
}

/**
 * Check if site can add more competitors
 */
export async function checkCompetitorLimit(siteId: string, currentCount: number): Promise<FeatureGateResult> {
  const subscription = await getSubscriptionBySiteId(siteId);

  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      reason: 'No active subscription found',
    };
  }

  const tier = subscription.tier as SubscriptionTier;
  const limit = getCompetitorLimit(tier);

  if (currentCount >= limit) {
    return {
      allowed: false,
      tier,
      reason: `Competitor limit reached (${limit} for ${tier} tier)`,
    };
  }

  return {
    allowed: true,
    tier,
  };
}

/**
 * Check if site can use a specific schema type
 */
export async function checkSchemaAccess(siteId: string, schemaType: SchemaType): Promise<FeatureGateResult> {
  const subscription = await getSubscriptionBySiteId(siteId);

  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      reason: 'No active subscription found',
    };
  }

  const tier = subscription.tier as SubscriptionTier;
  const hasAccess = tierSupportsSchemaType(tier, schemaType);

  return {
    allowed: hasAccess,
    tier,
    reason: hasAccess ? undefined : `Schema type ${schemaType} not available in ${tier} tier`,
  };
}

/**
 * Get current tier for a site
 */
export async function getSiteTier(siteId: string): Promise<SubscriptionTier | null> {
  const subscription = await getSubscriptionBySiteId(siteId);
  return subscription?.tier as SubscriptionTier || null;
}
