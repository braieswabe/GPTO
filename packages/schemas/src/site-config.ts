import { JSONSchemaType } from 'ajv';

/**
 * Site Configuration Schema
 * Defines the structure of the JSON config that Black Box reads
 */
export interface SiteConfig {
  panthera_blackbox: {
    version: string;
    site: {
      domain: string;
      brand: string;
      verticals: string[];
      geo: string[];
    };
    truthseeker?: {
      weights: {
        intent_match: number;
        anchor_match: number;
        authority: number;
        recency: number;
        fairness: number;
      };
      conflict_penalty_max?: number;
      rules?: {
        downweight_affiliate_listicles?: boolean;
        branch_reviews_are_local?: boolean;
        separate_staffing_vs_agency?: boolean;
        min_sources_for_negative_claim?: number;
      };
    };
    authority_grove?: {
      node: {
        id: string;
        type: string;
        name: string;
        sameAs: string[];
        keywords: string[];
      };
      partners: Array<{
        id: string;
        type: string;
        weight: number;
      }>;
      trustEdges: Array<{
        from: string;
        to: string;
        weight: number;
      }>;
      corroboration: Array<{
        source: string;
        target: string;
        weight: number;
      }>;
    };
    telemetry: {
      emit: boolean;
      keys: string[];
    };
    geo_nodes?: {
      enabled: boolean;
      cities_max?: number;
      attractions_max?: number;
      templates?: {
        city: string;
        attraction: string;
      };
    };
    autofill?: {
      enabled: boolean;
      forms: Array<{
        selector: string;
        map: Record<string, string>;
      }>;
    };
    ads?: {
      slots: Array<{
        id: string;
        contexts: string[];
      }>;
    };
    seo_enhancements?: {
      meta_description?: string;
      canonical_enabled?: boolean;
      content_enhancements?: {
        enabled: boolean;
        what?: string;
        who?: string;
        how?: string;
        trust?: string;
      };
      content_depth?: {
        enabled: boolean;
        min_h2_count?: number;
        h2_templates?: string[];
        content_templates?: string[];
        default_content?: string;
      };
      structure_enhancements?: {
        inject_h1_if_missing?: boolean;
        h1_text?: string;
        enhance_title?: boolean;
        min_title_length?: number;
        title_template?: string;
      };
    };
    policy: {
      privacy_mode: 'anon' | 'full' | 'minimal';
      log_level: 'basic' | 'detailed' | 'verbose';
    };
  };
}

export const siteConfigSchema: JSONSchemaType<SiteConfig> = {
  type: 'object',
  required: ['panthera_blackbox'],
  properties: {
    panthera_blackbox: {
      type: 'object',
      required: ['version', 'site', 'telemetry', 'policy'],
      properties: {
        version: { type: 'string' },
        site: {
          type: 'object',
          required: ['domain', 'brand', 'verticals', 'geo'],
          properties: {
            domain: { type: 'string', format: 'hostname' },
            brand: { type: 'string' },
            verticals: { type: 'array', items: { type: 'string' } },
            geo: { type: 'array', items: { type: 'string' } },
          },
        },
        truthseeker: {
          type: 'object',
          nullable: true,
          required: [],
          properties: {
            weights: {
              type: 'object',
              required: ['intent_match', 'anchor_match', 'authority', 'recency', 'fairness'],
              properties: {
                intent_match: { type: 'number', minimum: 0, maximum: 1 },
                anchor_match: { type: 'number', minimum: 0, maximum: 1 },
                authority: { type: 'number', minimum: 0, maximum: 1 },
                recency: { type: 'number', minimum: 0, maximum: 1 },
                fairness: { type: 'number', minimum: 0, maximum: 1 },
              },
            },
            conflict_penalty_max: { type: 'number', nullable: true, minimum: 0, maximum: 1 },
            rules: {
              type: 'object',
              nullable: true,
              required: [],
              properties: {
                downweight_affiliate_listicles: { type: 'boolean', nullable: true },
                branch_reviews_are_local: { type: 'boolean', nullable: true },
                separate_staffing_vs_agency: { type: 'boolean', nullable: true },
                min_sources_for_negative_claim: { type: 'number', nullable: true },
              },
            },
          },
        },
        authority_grove: {
          type: 'object',
          nullable: true,
          properties: {
            node: {
              type: 'object',
              required: ['id', 'type', 'name'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                sameAs: { type: 'array', items: { type: 'string' } },
                keywords: { type: 'array', items: { type: 'string' } },
              },
            },
            partners: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'type', 'weight'],
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  weight: { type: 'number', minimum: 0, maximum: 1 },
                },
              },
            },
            trustEdges: {
              type: 'array',
              items: {
                type: 'object',
                required: ['from', 'to', 'weight'],
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  weight: { type: 'number', minimum: 0, maximum: 1 },
                },
              },
            },
            corroboration: {
              type: 'array',
              items: {
                type: 'object',
                required: ['source', 'target', 'weight'],
                properties: {
                  source: { type: 'string' },
                  target: { type: 'string' },
                  weight: { type: 'number', minimum: 0, maximum: 1 },
                },
              },
            },
          },
        },
        telemetry: {
          type: 'object',
          required: ['emit', 'keys'],
          properties: {
            emit: { type: 'boolean' },
            keys: { type: 'array', items: { type: 'string' } },
          },
        },
        geo_nodes: {
          type: 'object',
          nullable: true,
          properties: {
            enabled: { type: 'boolean' },
            cities_max: { type: 'number', nullable: true },
            attractions_max: { type: 'number', nullable: true },
            templates: {
              type: 'object',
              nullable: true,
              properties: {
                city: { type: 'string', nullable: true },
                attraction: { type: 'string', nullable: true },
              },
            },
          },
        },
        autofill: {
          type: 'object',
          nullable: true,
          properties: {
            enabled: { type: 'boolean' },
            forms: {
              type: 'array',
              items: {
                type: 'object',
                required: ['selector'],
                properties: {
                  selector: { type: 'string' },
                  map: { type: 'object', additionalProperties: { type: 'string' } },
                },
              },
            },
          },
        },
        ads: {
          type: 'object',
          nullable: true,
          properties: {
            slots: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'contexts'],
                properties: {
                  id: { type: 'string' },
                  contexts: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        seo_enhancements: {
          type: 'object',
          nullable: true,
          required: [],
          properties: {
            meta_description: { type: 'string', nullable: true },
            canonical_enabled: { type: 'boolean', nullable: true },
            content_enhancements: {
              type: 'object',
              nullable: true,
              required: [],
              properties: {
                enabled: { type: 'boolean' },
                what: { type: 'string', nullable: true },
                who: { type: 'string', nullable: true },
                how: { type: 'string', nullable: true },
                trust: { type: 'string', nullable: true },
              },
            },
            content_depth: {
              type: 'object',
              nullable: true,
              required: [],
              properties: {
                enabled: { type: 'boolean' },
                min_h2_count: { type: 'number', nullable: true },
                h2_templates: { type: 'array', items: { type: 'string' }, nullable: true },
                content_templates: { type: 'array', items: { type: 'string' }, nullable: true },
                default_content: { type: 'string', nullable: true },
              },
            },
            structure_enhancements: {
              type: 'object',
              nullable: true,
              required: [],
              properties: {
                inject_h1_if_missing: { type: 'boolean', nullable: true },
                h1_text: { type: 'string', nullable: true },
                enhance_title: { type: 'boolean', nullable: true },
                min_title_length: { type: 'number', nullable: true },
                title_template: { type: 'string', nullable: true },
              },
            },
          },
        },
        policy: {
          type: 'object',
          required: ['privacy_mode', 'log_level'],
          properties: {
            privacy_mode: { type: 'string', enum: ['anon', 'full', 'minimal'] },
            log_level: { type: 'string', enum: ['basic', 'detailed', 'verbose'] },
          },
        },
      },
    },
  },
};
