import { createCampaign, AdsProvider } from '@gpto/api-lattice/src/ads';

/**
 * Paid Servo - PPC campaign management
 */

export interface PaidCampaignRequest {
  provider: AdsProvider;
  siteId: string;
  budget: number;
  targetAudience: {
    intent?: string[];
    geo?: string[];
    demographics?: Record<string, unknown>;
  };
  creative?: {
    headline: string;
    description: string;
  };
}

export interface PaidCampaignResult {
  campaignId: string;
  provider: AdsProvider;
  status: 'active' | 'paused' | 'pending';
  performance?: {
    impressions: number;
    clicks: number;
    conversions: number;
    cpc: number;
  };
}

/**
 * Create and optimize PPC campaign
 */
export async function createPPCCampaign(
  request: PaidCampaignRequest,
  apiKey: string
): Promise<PaidCampaignResult> {
  const campaign = await createCampaign(request.provider, apiKey, {
    name: `GPTO Campaign ${request.siteId}`,
    budget: request.budget,
    targetAudience: request.targetAudience,
    creative: request.creative || {
      headline: 'Default Headline',
      description: 'Default Description',
    },
  });

  return {
    campaignId: campaign.campaignId || '',
    provider: request.provider,
    status: 'pending',
  };
}
