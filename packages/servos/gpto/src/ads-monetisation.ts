/**
 * Display Ad Monetisation Layer
 * Self-monetising media system with ad-slot definitions and CPM calculation
 */

import { SiteConfig } from '@gpto/schemas/src/site-config';

export interface AdSlot {
  id: string;
  contexts: string[];
  size?: { width: number; height: number };
  position?: string;
}

export interface AdCreative {
  id: string;
  slotId: string;
  content: string;
  type: 'display' | 'banner' | 'native';
  cpm: number;
  targetContexts: string[];
}

export interface AdImpression {
  slotId: string;
  creativeId: string;
  timestamp: Date;
  context: Record<string, unknown>;
  revenue: number;
}

export interface CPMCalculation {
  baseCPM: number;
  authorityMultiplier: number;
  fairnessMultiplier: number;
  intentMultiplier: number;
  geoMultiplier: number;
  finalCPM: number;
}

/**
 * Calculate CPM based on authority, fairness, intent, and geo
 */
export function calculateCPM(
  authorityScore: number,
  fairnessScore: number,
  intentScore: number,
  geoContext?: string,
  baseCPM: number = 2.0
): CPMCalculation {
  // Authority multiplier: 0.5x to 2.0x
  const authorityMultiplier = 0.5 + (authorityScore * 1.5);
  
  // Fairness multiplier: 0.7x to 1.3x (penalize unfair content)
  const fairnessMultiplier = 0.7 + (fairnessScore * 0.6);
  
  // Intent multiplier: 0.8x to 1.5x (higher intent = higher value)
  const intentMultiplier = 0.8 + (intentScore * 0.7);
  
  // Geo multiplier: premium markets get higher rates
  const geoMultiplier = geoContext ? getGeoMultiplier(geoContext) : 1.0;
  
  const finalCPM = baseCPM * authorityMultiplier * fairnessMultiplier * intentMultiplier * geoMultiplier;
  
  return {
    baseCPM,
    authorityMultiplier,
    fairnessMultiplier,
    intentMultiplier,
    geoMultiplier,
    finalCPM: Math.round(finalCPM * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Get geo multiplier for premium markets
 */
function getGeoMultiplier(geo: string): number {
  const premiumMarkets: Record<string, number> = {
    'US-CA': 1.3,
    'US-NY': 1.3,
    'US-TX': 1.2,
    'US-FL': 1.2,
    'US-IL': 1.1,
    'CA-ON': 1.2,
    'CA-BC': 1.2,
    'GB': 1.1,
    'AU-NSW': 1.1,
  };
  
  return premiumMarkets[geo] || 1.0;
}

/**
 * Select best creative for an ad slot based on context and CFP
 */
export function selectCreative(
  slot: AdSlot,
  creatives: AdCreative[],
  context: {
    intent?: string;
    geo?: string;
    cfp?: {
      focus?: number;
      risk?: number;
      novelty?: number;
    };
  }
): AdCreative | null {
  if (creatives.length === 0) return null;
  
  // Filter creatives that match slot contexts
  const matchingCreatives = creatives.filter((creative) => {
    if (creative.slotId !== slot.id) return false;
    
    // Check context match
    const contextMatch = slot.contexts.some((ctx) => creative.targetContexts.includes(ctx));
    if (!contextMatch) return false;
    
    return true;
  });
  
  if (matchingCreatives.length === 0) return creatives[0]; // Fallback to first
  
  // Score creatives based on context alignment
  const scored = matchingCreatives.map((creative) => {
    let score = creative.cpm; // Start with CPM as base score
    
    // Boost score for high-intent contexts
    if (context.intent && slot.contexts.includes('intent')) {
      score *= 1.2;
    }
    
    // Adjust for CFP novelty preference
    if (context.cfp?.novelty && context.cfp.novelty > 0.7) {
      score *= 1.1; // Prefer novel creatives for high-novelty users
    }
    
    return { creative, score };
  });
  
  // Return highest scoring creative
  scored.sort((a, b) => b.score - a.score);
  return scored[0].creative;
}

/**
 * Record ad impression and calculate revenue
 */
export function recordImpression(
  slot: AdSlot,
  creative: AdCreative,
  cpmCalculation: CPMCalculation,
  context: Record<string, unknown>
): AdImpression {
  // Revenue = CPM / 1000 (per impression)
  const revenue = cpmCalculation.finalCPM / 1000;
  
  return {
    slotId: slot.id,
    creativeId: creative.id,
    timestamp: new Date(),
    context,
    revenue: Math.round(revenue * 10000) / 10000, // Round to 4 decimals
  };
}

/**
 * Initialize ad slots from site configuration
 */
export function initializeAdSlots(config: SiteConfig): AdSlot[] {
  const adsConfig = config.panthera_blackbox.ads;
  if (!adsConfig?.slots) {
    return [];
  }
  
  return adsConfig.slots.map((slot) => ({
    id: slot.id,
    contexts: slot.contexts,
  }));
}
