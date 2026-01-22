import type { SiteConfig } from '@gpto/schemas/src/site-config';
import type { PantheraCanonPlan } from './plan-structure';

/**
 * Apply authority optimizations from plan to config
 */
export function optimizeAuthority(
  config: SiteConfig,
  plan: PantheraCanonPlan
): SiteConfig {
  const optimized = JSON.parse(JSON.stringify(config)) as SiteConfig;

  // Find authority-related actions
  const authorityActions = plan.phases
    .flatMap(phase => phase.actions)
    .filter(action => action.type === 'link' || action.id.includes('authority'));

  // Apply authority optimizations
  authorityActions.forEach(action => {
    if (action.id === 'authority-grove' && !optimized.panthera_blackbox.authority_grove) {
      // Initialize authority grove if not present
      optimized.panthera_blackbox.authority_grove = {
        node: {
          id: `https://${optimized.panthera_blackbox.site.domain}`,
          type: 'Organization',
          name: optimized.panthera_blackbox.site.brand,
          sameAs: [],
          keywords: optimized.panthera_blackbox.site.verticals || [],
        },
        partners: [],
        trustEdges: [],
        corroboration: [],
      };
    }
  });

  return optimized;
}

/**
 * Apply semantic optimizations from plan to config
 */
export function optimizeSemantic(
  config: SiteConfig,
  plan: PantheraCanonPlan
): SiteConfig {
  const optimized = JSON.parse(JSON.stringify(config)) as SiteConfig;

  // Find semantic-related actions
  const semanticActions = plan.phases
    .flatMap(phase => phase.actions)
    .filter(action => action.type === 'semantic' || action.type === 'schema');

  // Apply semantic optimizations
  semanticActions.forEach(action => {
    if (action.id === 'schema-expansion') {
      // Ensure schema types are enabled (handled by tier in runtime)
      // This would add schema configuration to config
    }
  });

  return optimized;
}

/**
 * Apply all optimizations from plan
 */
export function applyOptimizations(
  config: SiteConfig,
  plan: PantheraCanonPlan
): SiteConfig {
  let optimized = config;

  // Apply authority optimizations
  optimized = optimizeAuthority(optimized, plan);

  // Apply semantic optimizations
  optimized = optimizeSemantic(optimized, plan);

  return optimized;
}
