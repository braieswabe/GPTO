import { SiteConfig } from '@gpto/schemas/src/site-config';

/**
 * Authority Grove Module
 * Manages trust graph, partner relationships, and authority scoring
 */

export interface AuthorityNode {
  id: string;
  type: string;
  name: string;
  sameAs: string[];
  keywords: string[];
}

export interface Partner {
  id: string;
  type: string;
  weight: number;
}

export interface TrustEdge {
  from: string;
  to: string;
  weight: number;
}

export interface AuthorityGroveData {
  node: AuthorityNode;
  partners: Partner[];
  trustEdges: TrustEdge[];
  corroboration: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
}

/**
 * Get authority score for a node
 */
export function calculateAuthorityScore(
  nodeId: string,
  grove: AuthorityGroveData
): number {
  let score = 0.5; // Base score

  // Add partner weights
  for (const partner of grove.partners) {
    score += partner.weight * 0.1;
  }

  // Add trust edge weights
  for (const edge of grove.trustEdges) {
    if (edge.to === nodeId) {
      score += edge.weight * 0.15;
    }
  }

  // Add corroboration weights
  for (const corr of grove.corroboration) {
    if (corr.target === nodeId) {
      score += corr.weight * 0.1;
    }
  }

  return Math.min(1.0, score);
}

/**
 * Generate backlink plan
 */
export function generateBacklinkPlan(
  config: SiteConfig,
  targetSites: string[]
): Array<{ site: string; anchor: string; context: string }> {
  const node = config.panthera_blackbox.authority_grove?.node;
  if (!node) {
    return [];
  }

  return targetSites.map((site) => ({
    site,
    anchor: node.name,
    context: `Verified partner: ${node.name}`,
  }));
}

/**
 * Update authority grove from config
 */
export function parseAuthorityGrove(config: SiteConfig): AuthorityGroveData | null {
  const grove = config.panthera_blackbox.authority_grove;
  if (!grove) {
    return null;
  }

  return {
    node: grove.node,
    partners: grove.partners || [],
    trustEdges: grove.trustEdges || [],
    corroboration: grove.corroboration || [],
  };
}

/**
 * Generate JSON-LD for authority network
 */
export function generateAuthoritySchema(grove: AuthorityGroveData): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': grove.node.id,
    name: grove.node.name,
    sameAs: grove.node.sameAs,
    keywords: grove.node.keywords,
    // Add partner relationships
    ...(grove.partners.length > 0 && {
      memberOf: grove.partners.map((p) => ({
        '@type': p.type,
        '@id': p.id,
      })),
    }),
  };
}
