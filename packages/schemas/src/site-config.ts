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
