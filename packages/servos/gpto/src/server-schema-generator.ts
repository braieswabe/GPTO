/**
 * Server-Side Schema Generator
 * 
 * Generates JSON-LD schemas server-side so they're visible in initial HTML
 * This makes schemas visible to external audit tools that don't execute JavaScript
 */

import type { SiteConfig } from '@gpto/schemas/src/site-config';

export interface SchemaGenerationOptions {
  tier?: 'bronze' | 'silver' | 'gold';
  includeLocalBusiness?: boolean;
}

/**
 * Generate Organization schema from config
 */
export function generateOrganizationSchema(
  config: SiteConfig['panthera_blackbox'],
  _options: SchemaGenerationOptions = {}
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.site.brand,
    url: `https://${config.site.domain}`,
  };

  // Add authority grove data if available
  if (config.authority_grove?.node) {
    if (config.authority_grove.node.sameAs && config.authority_grove.node.sameAs.length > 0) {
      schema.sameAs = config.authority_grove.node.sameAs;
    }
    if (config.authority_grove.node.keywords && config.authority_grove.node.keywords.length > 0) {
      schema.keywords = config.authority_grove.node.keywords;
    }
  }

  return schema;
}

/**
 * Generate LocalBusiness schema if geo data exists
 */
export function generateLocalBusinessSchemaFromConfig(
  config: SiteConfig['panthera_blackbox']
): Record<string, unknown> | null {
  if (!config.site.geo || config.site.geo.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.site.brand,
    url: `https://${config.site.domain}`,
    areaServed: config.site.geo,
  };
}

/**
 * Generate all schemas for a config
 */
export function generateAllSchemas(
  config: SiteConfig['panthera_blackbox'],
  options: SchemaGenerationOptions = {}
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];

  // Always generate Organization schema
  schemas.push(generateOrganizationSchema(config, options));

  // Generate LocalBusiness if geo data exists and tier allows it
  const tier = options.tier || 'bronze';
  if ((tier === 'silver' || tier === 'gold' || options.includeLocalBusiness) && config.site.geo) {
    const localBusiness = generateLocalBusinessSchemaFromConfig(config);
    if (localBusiness) {
      schemas.push(localBusiness);
    }
  }

  return schemas;
}

/**
 * Generate HTML script tags for schemas
 */
export function generateSchemaScriptTags(
  config: SiteConfig['panthera_blackbox'],
  options: SchemaGenerationOptions = {}
): string {
  const schemas = generateAllSchemas(config, options);
  
  return schemas
    .map((schema, index) => {
      return `<script type="application/ld+json" data-panthera="true" data-schema-index="${index}">${JSON.stringify(schema, null, 0)}</script>`;
    })
    .join('\n');
}

/**
 * Inject schemas into HTML string
 */
export function injectSchemasIntoHTML(
  html: string,
  config: SiteConfig['panthera_blackbox'],
  options: SchemaGenerationOptions = {}
): string {
  const schemaScripts = generateSchemaScriptTags(config, options);

  // Try to inject before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${schemaScripts}\n</head>`);
  }

  // Fallback: inject at the beginning
  return `${schemaScripts}\n${html}`;
}
