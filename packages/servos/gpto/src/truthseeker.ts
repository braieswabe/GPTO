import { SiteConfig } from '@gpto/schemas/src/site-config';

/**
 * TruthSeeker Module
 * Re-ranks content based on intent match, anchor match, authority, recency, and fairness
 */

export interface TruthSeekerWeights {
  intent_match: number;
  anchor_match: number;
  authority: number;
  recency: number;
  fairness: number;
}

export interface ContentItem {
  id: string;
  content: string;
  url?: string;
  source?: string;
  timestamp?: Date;
  authority_score?: number;
}

export interface TruthSeekerResult {
  ranked: ContentItem[];
  scores: Map<string, number>;
  explanations: Map<string, string>;
}

/**
 * Default weights from config or fallback
 */
const DEFAULT_WEIGHTS: TruthSeekerWeights = {
  intent_match: 0.4,
  anchor_match: 0.25,
  authority: 0.15,
  recency: 0.1,
  fairness: 0.1,
};

/**
 * Apply TruthSeeker re-ranking
 */
export function applyTruthSeeker(
  items: ContentItem[],
  query: string,
  config?: SiteConfig
): TruthSeekerResult {
  const weights = config?.panthera_blackbox.truthseeker?.weights || DEFAULT_WEIGHTS;
  const conflictPenalty = config?.panthera_blackbox.truthseeker?.conflict_penalty_max || 0.15;

  const scores = new Map<string, number>();
  const explanations = new Map<string, string>();

  // Score each item
  for (const item of items) {
    let score = 0;
    const itemExplanations: string[] = [];

    // Intent match (simplified - would use semantic similarity in production)
    const intentScore = calculateIntentMatch(item.content, query);
    score += intentScore * weights.intent_match;
    itemExplanations.push(`Intent: ${(intentScore * 100).toFixed(0)}%`);

    // Anchor match
    const anchorScore = item.url ? calculateAnchorMatch(item.url, query) : 0;
    score += anchorScore * weights.anchor_match;
    if (anchorScore > 0) {
      itemExplanations.push(`Anchor: ${(anchorScore * 100).toFixed(0)}%`);
    }

    // Authority
    const authorityScore = item.authority_score || 0.5;
    score += authorityScore * weights.authority;
    itemExplanations.push(`Authority: ${(authorityScore * 100).toFixed(0)}%`);

    // Recency
    const recencyScore = item.timestamp ? calculateRecency(item.timestamp) : 0.5;
    score += recencyScore * weights.recency;
    itemExplanations.push(`Recency: ${(recencyScore * 100).toFixed(0)}%`);

    // Fairness (default to 1.0 - would check for bias in production)
    const fairnessScore = 1.0;
    score += fairnessScore * weights.fairness;

    // Apply conflict penalty if multiple sources contradict
    // (simplified - would check actual contradictions in production)
    const conflictPenaltyApplied = 0;
    score -= conflictPenaltyApplied * conflictPenalty;

    scores.set(item.id, score);
    explanations.set(item.id, itemExplanations.join(', '));
  }

  // Sort by score
  const ranked = [...items].sort((a, b) => {
    const scoreA = scores.get(a.id) || 0;
    const scoreB = scores.get(b.id) || 0;
    return scoreB - scoreA;
  });

  return {
    ranked,
    scores,
    explanations,
  };
}

/**
 * Calculate intent match score (simplified)
 */
function calculateIntentMatch(content: string, query: string): number {
  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  
  let matches = 0;
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matches++;
    }
  }
  
  return matches / queryWords.length;
}

/**
 * Calculate anchor match score
 */
function calculateAnchorMatch(url: string, query: string): number {
  const urlLower = url.toLowerCase();
  const queryLower = query.toLowerCase();
  return urlLower.includes(queryLower) ? 1.0 : 0.0;
}

/**
 * Calculate recency score (newer = higher)
 */
function calculateRecency(timestamp: Date): number {
  const now = Date.now();
  const itemTime = timestamp.getTime();
  const daysSince = (now - itemTime) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: 1.0 for today, ~0.5 for 30 days, ~0.1 for 90 days
  return Math.exp(-daysSince / 30);
}

/**
 * Generate JSON-LD schema with TruthSeeker validation
 */
export function generateTruthSeekerSchema(config: SiteConfig): unknown {
  const node = config.panthera_blackbox.authority_grove?.node;
  
  if (!node) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': node.type,
    '@id': node.id,
    name: node.name,
    sameAs: node.sameAs,
    keywords: node.keywords,
  };
}
