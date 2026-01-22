import type { SubscriptionTier } from '@gpto/billing';

export type SchemaType = 'Organization' | 'Product' | 'Service' | 'LocalBusiness' | 'FAQPage';
export type BlackBoxMode = 'none' | 'mini' | 'full';
export type AuditFrequency = 'on-demand' | 'quarterly' | 'monthly';
export type ReportType = 'pdf' | 'email' | 'scorecard' | 'dashboard';

export interface TierFeatures {
  schemaTypes: SchemaType[] | '*';
  competitorCount: number;
  auditFrequency: AuditFrequency;
  blackBoxMode: BlackBoxMode;
  reports: ReportType[];
  pantheraCanon?: boolean;
  multiMarket?: boolean;
  aiLinkBuilding?: boolean;
}

/**
 * Tier feature definitions
 */
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  bronze: {
    schemaTypes: ['Organization'], // Core JSON-LD only
    competitorCount: 1,
    auditFrequency: 'on-demand',
    blackBoxMode: 'none',
    reports: ['pdf', 'email', 'scorecard'],
  },
  silver: {
    schemaTypes: ['Organization', 'Product', 'Service', 'LocalBusiness', 'FAQPage'],
    competitorCount: 5,
    auditFrequency: 'quarterly',
    blackBoxMode: 'mini', // Mini telemetry module
    reports: ['pdf', 'email', 'scorecard'],
    pantheraCanon: true,
  },
  gold: {
    schemaTypes: '*', // All schema types
    competitorCount: 10,
    auditFrequency: 'monthly',
    blackBoxMode: 'full', // Full Black Box
    reports: ['pdf', 'email', 'scorecard', 'dashboard'],
    pantheraCanon: true,
    multiMarket: true,
    aiLinkBuilding: true,
  },
};

/**
 * Get tier features
 */
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier];
}

/**
 * Check if tier supports a specific schema type
 */
export function tierSupportsSchemaType(tier: SubscriptionTier, schemaType: SchemaType): boolean {
  const features = getTierFeatures(tier);
  return features.schemaTypes === '*' || features.schemaTypes.includes(schemaType);
}

/**
 * Check if tier supports a specific feature
 */
export function tierSupportsFeature(tier: SubscriptionTier, feature: keyof TierFeatures): boolean {
  const features = getTierFeatures(tier);
  return Boolean(features[feature]);
}

/**
 * Get competitor count limit for tier
 */
export function getCompetitorLimit(tier: SubscriptionTier): number {
  return getTierFeatures(tier).competitorCount;
}

/**
 * Get audit frequency for tier
 */
export function getAuditFrequency(tier: SubscriptionTier): AuditFrequency {
  return getTierFeatures(tier).auditFrequency;
}
