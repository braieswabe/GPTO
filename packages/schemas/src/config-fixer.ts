import { siteConfigSchema, SiteConfig } from './site-config';
import { validator } from './validator';

/**
 * Sample reference configurations for different use cases
 * These serve as templates for fixing invalid configurations
 */
export const SAMPLE_CONFIGS = {
  minimal: {
    panthera_blackbox: {
      version: '1.1.0',
      site: {
        domain: 'example.com',
        brand: 'Example Brand',
        verticals: ['general'],
        geo: ['US'],
      },
      policy: {
        privacy_mode: 'anon',
        log_level: 'basic',
      },
      telemetry: {
        emit: true,
        keys: ['ai.schemaCompleteness', 'ai.searchVisibility'],
      },
    },
  } as SiteConfig,

  ecommerce: {
    panthera_blackbox: {
      version: '1.1.0',
      site: {
        domain: 'shop.example.com',
        brand: 'Example Shop',
        verticals: ['ecommerce', 'retail', 'shopping'],
        geo: ['US', 'CA'],
      },
      policy: {
        privacy_mode: 'anon',
        log_level: 'detailed',
      },
      telemetry: {
        emit: true,
        keys: [
          'ai.schemaCompleteness',
          'ai.searchVisibility',
          'conversion.purchase',
          'conversion.add_to_cart',
        ],
      },
      autofill: {
        enabled: true,
        forms: [
          {
            selector: 'form#checkout',
            map: {
              email: 'input[name="email"]',
              name: 'input[name="name"]',
            },
          },
        ],
      },
      ads: {
        slots: [
          {
            id: 'product-sidebar',
            contexts: ['product', 'category'],
          },
        ],
      },
      seo_enhancements: {
        meta_description: 'Shop the best products online',
        canonical_enabled: true,
        content_enhancements: {
          enabled: true,
          what: 'We offer high-quality products for online shoppers',
          who: 'Designed for customers looking for quality products',
          how: 'Browse our catalog, add items to cart, and checkout securely',
          trust: 'Secure checkout, fast shipping, money-back guarantee',
        },
      },
    },
  } as SiteConfig,

  healthcare: {
    panthera_blackbox: {
      version: '1.1.0',
      site: {
        domain: 'clinic.example.com',
        brand: 'Example Medical Clinic',
        verticals: ['healthcare', 'medical', 'health'],
        geo: ['US'],
      },
      policy: {
        privacy_mode: 'full',
        log_level: 'detailed',
      },
      telemetry: {
        emit: true,
        keys: [
          'ai.schemaCompleteness',
          'ai.searchVisibility',
          'user.appointment_scheduled',
        ],
      },
      autofill: {
        enabled: true,
        forms: [
          {
            selector: 'form#appointment',
            map: {
              patient_name: 'input[name="name"]',
              email: 'input[name="email"]',
              phone: 'input[name="phone"]',
            },
          },
        ],
      },
      authority_grove: {
        node: {
          id: 'https://clinic.example.com',
          type: 'MedicalOrganization',
          name: 'Example Medical Clinic',
          sameAs: [],
          keywords: ['healthcare', 'medical', 'clinic'],
        },
        partners: [],
        trustEdges: [],
        corroboration: [],
      },
      seo_enhancements: {
        meta_description: 'Trusted medical clinic providing quality healthcare services',
        canonical_enabled: true,
        content_enhancements: {
          enabled: true,
          what: 'We provide comprehensive medical services and healthcare solutions',
          who: 'Serving patients seeking quality medical care',
          how: 'Schedule an appointment online or call our clinic',
          trust: 'Licensed medical professionals, HIPAA compliant, patient privacy protected',
        },
      },
    },
  } as SiteConfig,

  education: {
    panthera_blackbox: {
      version: '1.1.0',
      site: {
        domain: 'university.example.com',
        brand: 'Example University',
        verticals: ['education', 'higher_education', 'university'],
        geo: ['US'],
      },
      policy: {
        privacy_mode: 'anon',
        log_level: 'detailed',
      },
      telemetry: {
        emit: true,
        keys: [
          'ai.schemaCompleteness',
          'ai.searchVisibility',
          'user.enrollment_started',
          'user.enrollment_completed',
        ],
      },
      authority_grove: {
        node: {
          id: 'https://university.example.com',
          type: 'EducationalOrganization',
          name: 'Example University',
          sameAs: [],
          keywords: ['education', 'university', 'higher education'],
        },
        partners: [],
        trustEdges: [],
        corroboration: [],
      },
      geo_nodes: {
        enabled: true,
        cities_max: 5,
        attractions_max: 3,
      },
      seo_enhancements: {
        meta_description: 'Leading university offering quality education programs',
        canonical_enabled: true,
        content_enhancements: {
          enabled: true,
          what: 'We provide quality higher education programs and academic excellence',
          who: 'Designed for students seeking quality education',
          how: 'Apply online, submit documents, and enroll in programs',
          trust: 'Accredited institution, experienced faculty, student success focused',
        },
      },
    },
  } as SiteConfig,
};

/**
 * Fixes a configuration by:
 * 1. Removing invalid fields not in schema
 * 2. Adding missing required fields
 * 3. Fixing invalid field values
 * 4. Ensuring proper structure
 */
export function fixConfig(config: unknown, referenceConfig?: SiteConfig): {
  fixedConfig: SiteConfig;
  errors: string[];
  fixes: string[];
} {
  const errors: string[] = [];
  const fixes: string[] = [];
  
  // Start with a clean base from reference or minimal config
  const baseConfig = referenceConfig || SAMPLE_CONFIGS.minimal;
  const fixed = JSON.parse(JSON.stringify(baseConfig)) as any;
  
  const input = config as any;
  
  // Ensure panthera_blackbox exists
  if (!input?.panthera_blackbox) {
    errors.push('Missing panthera_blackbox root object');
    return { fixedConfig: fixed, errors, fixes };
  }
  
  const inputPb = input.panthera_blackbox;
  
  // Fix version
  if (inputPb.version && typeof inputPb.version === 'string') {
    fixed.panthera_blackbox.version = inputPb.version;
  } else {
    fixes.push('Added missing version field');
  }
  
  // Fix site (required)
  if (inputPb.site) {
    fixed.panthera_blackbox.site = {
      domain: typeof inputPb.site.domain === 'string' ? inputPb.site.domain : baseConfig.panthera_blackbox.site.domain,
      brand: typeof inputPb.site.brand === 'string' ? inputPb.site.brand : baseConfig.panthera_blackbox.site.brand,
      verticals: Array.isArray(inputPb.site.verticals) ? inputPb.site.verticals.filter((v: unknown) => typeof v === 'string') : baseConfig.panthera_blackbox.site.verticals,
      geo: Array.isArray(inputPb.site.geo) ? inputPb.site.geo.filter((g: unknown) => typeof g === 'string') : baseConfig.panthera_blackbox.site.geo,
    };
  } else {
    errors.push('Missing required site object');
    fixes.push('Added missing site object with default values');
  }
  
  // Fix policy (required)
  if (inputPb.policy) {
    const validPrivacyModes = ['anon', 'full', 'minimal'];
    const validLogLevels = ['basic', 'detailed', 'verbose'];
    
    fixed.panthera_blackbox.policy = {
      privacy_mode: validPrivacyModes.includes(inputPb.policy.privacy_mode) 
        ? inputPb.policy.privacy_mode 
        : 'anon',
      log_level: validLogLevels.includes(inputPb.policy.log_level)
        ? inputPb.policy.log_level
        : 'basic',
    };
    
    if (!validPrivacyModes.includes(inputPb.policy.privacy_mode)) {
      fixes.push(`Fixed invalid privacy_mode: ${inputPb.policy.privacy_mode} -> anon`);
    }
    if (!validLogLevels.includes(inputPb.policy.log_level)) {
      fixes.push(`Fixed invalid log_level: ${inputPb.policy.log_level} -> basic`);
    }
  } else {
    errors.push('Missing required policy object');
    fixes.push('Added missing policy object with default values');
  }
  
  // Fix telemetry (required)
  if (inputPb.telemetry) {
    fixed.panthera_blackbox.telemetry = {
      emit: typeof inputPb.telemetry.emit === 'boolean' ? inputPb.telemetry.emit : true,
      keys: Array.isArray(inputPb.telemetry.keys) 
        ? inputPb.telemetry.keys.filter((k: unknown) => typeof k === 'string')
        : baseConfig.panthera_blackbox.telemetry.keys,
    };
  } else {
    errors.push('Missing required telemetry object');
    fixes.push('Added missing telemetry object with default values');
  }
  
  // Fix optional autofill
  if (inputPb.autofill) {
    if (typeof inputPb.autofill.enabled === 'boolean') {
      fixed.panthera_blackbox.autofill = {
        enabled: inputPb.autofill.enabled,
        forms: Array.isArray(inputPb.autofill.forms)
          ? inputPb.autofill.forms
              .filter((form: any) => form && typeof form.selector === 'string')
              .map((form: any) => ({
                selector: form.selector,
                map: typeof form.map === 'object' && form.map !== null
                  ? Object.fromEntries(
                      Object.entries(form.map).filter(([_, v]) => typeof v === 'string')
                    )
                  : {},
              }))
          : [],
      };
    }
  }
  
  // Fix optional ads
  if (inputPb.ads && Array.isArray(inputPb.ads.slots)) {
    fixed.panthera_blackbox.ads = {
      slots: inputPb.ads.slots
        .filter((slot: any) => slot && typeof slot.id === 'string')
        .map((slot: any) => ({
          id: slot.id,
          contexts: Array.isArray(slot.contexts)
            ? slot.contexts.filter((c: unknown) => typeof c === 'string')
            : [],
        })),
    };
  }
  
  // Fix optional geo_nodes
  if (inputPb.geo_nodes) {
    fixed.panthera_blackbox.geo_nodes = {
      enabled: typeof inputPb.geo_nodes.enabled === 'boolean' ? inputPb.geo_nodes.enabled : false,
      cities_max: typeof inputPb.geo_nodes.cities_max === 'number' ? inputPb.geo_nodes.cities_max : undefined,
      attractions_max: typeof inputPb.geo_nodes.attractions_max === 'number' ? inputPb.geo_nodes.attractions_max : undefined,
      templates: inputPb.geo_nodes.templates && typeof inputPb.geo_nodes.templates === 'object'
        ? {
            city: typeof inputPb.geo_nodes.templates.city === 'string' ? inputPb.geo_nodes.templates.city : undefined,
            attraction: typeof inputPb.geo_nodes.templates.attraction === 'string' ? inputPb.geo_nodes.templates.attraction : undefined,
          }
        : undefined,
    };
  }
  
  // Fix optional authority_grove
  if (inputPb.authority_grove) {
    if (inputPb.authority_grove.node && 
        typeof inputPb.authority_grove.node.id === 'string' &&
        typeof inputPb.authority_grove.node.type === 'string' &&
        typeof inputPb.authority_grove.node.name === 'string') {
      fixed.panthera_blackbox.authority_grove = {
        node: {
          id: inputPb.authority_grove.node.id,
          type: inputPb.authority_grove.node.type,
          name: inputPb.authority_grove.node.name,
          sameAs: Array.isArray(inputPb.authority_grove.node.sameAs)
            ? inputPb.authority_grove.node.sameAs.filter((s: unknown) => typeof s === 'string')
            : [],
          keywords: Array.isArray(inputPb.authority_grove.node.keywords)
            ? inputPb.authority_grove.node.keywords.filter((k: unknown) => typeof k === 'string')
            : [],
        },
        partners: Array.isArray(inputPb.authority_grove.partners)
          ? inputPb.authority_grove.partners
              .filter((p: any) => p && typeof p.id === 'string' && typeof p.type === 'string' && typeof p.weight === 'number')
              .map((p: any) => ({
                id: p.id,
                type: p.type,
                weight: Math.max(0, Math.min(1, p.weight)),
              }))
          : [],
        trustEdges: Array.isArray(inputPb.authority_grove.trustEdges)
          ? inputPb.authority_grove.trustEdges
              .filter((e: any) => e && typeof e.from === 'string' && typeof e.to === 'string' && typeof e.weight === 'number')
              .map((e: any) => ({
                from: e.from,
                to: e.to,
                weight: Math.max(0, Math.min(1, e.weight)),
              }))
          : [],
        corroboration: Array.isArray(inputPb.authority_grove.corroboration)
          ? inputPb.authority_grove.corroboration
              .filter((c: any) => c && typeof c.source === 'string' && typeof c.target === 'string' && typeof c.weight === 'number')
              .map((c: any) => ({
                source: c.source,
                target: c.target,
                weight: Math.max(0, Math.min(1, c.weight)),
              }))
          : [],
      };
    }
  }
  
  // Fix optional truthseeker
  if (inputPb.truthseeker && inputPb.truthseeker.weights) {
    const weights = inputPb.truthseeker.weights;
    fixed.panthera_blackbox.truthseeker = {
      weights: {
        intent_match: typeof weights.intent_match === 'number' ? Math.max(0, Math.min(1, weights.intent_match)) : 0.3,
        anchor_match: typeof weights.anchor_match === 'number' ? Math.max(0, Math.min(1, weights.anchor_match)) : 0.2,
        authority: typeof weights.authority === 'number' ? Math.max(0, Math.min(1, weights.authority)) : 0.25,
        recency: typeof weights.recency === 'number' ? Math.max(0, Math.min(1, weights.recency)) : 0.15,
        fairness: typeof weights.fairness === 'number' ? Math.max(0, Math.min(1, weights.fairness)) : 0.1,
      },
    };
  }
  
  // Fix optional seo_enhancements
  if (inputPb.seo_enhancements) {
    fixed.panthera_blackbox.seo_enhancements = {
      meta_description: typeof inputPb.seo_enhancements.meta_description === 'string' 
        ? inputPb.seo_enhancements.meta_description 
        : undefined,
      canonical_enabled: typeof inputPb.seo_enhancements.canonical_enabled === 'boolean'
        ? inputPb.seo_enhancements.canonical_enabled
        : undefined,
      content_enhancements: inputPb.seo_enhancements.content_enhancements && typeof inputPb.seo_enhancements.content_enhancements.enabled === 'boolean'
        ? {
            enabled: inputPb.seo_enhancements.content_enhancements.enabled,
            what: typeof inputPb.seo_enhancements.content_enhancements.what === 'string' 
              ? inputPb.seo_enhancements.content_enhancements.what 
              : undefined,
            who: typeof inputPb.seo_enhancements.content_enhancements.who === 'string'
              ? inputPb.seo_enhancements.content_enhancements.who
              : undefined,
            how: typeof inputPb.seo_enhancements.content_enhancements.how === 'string'
              ? inputPb.seo_enhancements.content_enhancements.how
              : undefined,
            trust: typeof inputPb.seo_enhancements.content_enhancements.trust === 'string'
              ? inputPb.seo_enhancements.content_enhancements.trust
              : undefined,
          }
        : undefined,
      content_depth: inputPb.seo_enhancements.content_depth && typeof inputPb.seo_enhancements.content_depth.enabled === 'boolean'
        ? {
            enabled: inputPb.seo_enhancements.content_depth.enabled,
            min_h2_count: typeof inputPb.seo_enhancements.content_depth.min_h2_count === 'number'
              ? inputPb.seo_enhancements.content_depth.min_h2_count
              : undefined,
            h2_templates: Array.isArray(inputPb.seo_enhancements.content_depth.h2_templates)
              ? inputPb.seo_enhancements.content_depth.h2_templates.filter((t: unknown) => typeof t === 'string')
              : undefined,
            content_templates: Array.isArray(inputPb.seo_enhancements.content_depth.content_templates)
              ? inputPb.seo_enhancements.content_depth.content_templates.filter((t: unknown) => typeof t === 'string')
              : undefined,
            default_content: typeof inputPb.seo_enhancements.content_depth.default_content === 'string'
              ? inputPb.seo_enhancements.content_depth.default_content
              : undefined,
          }
        : undefined,
      structure_enhancements: inputPb.seo_enhancements.structure_enhancements
        ? {
            inject_h1_if_missing: typeof inputPb.seo_enhancements.structure_enhancements.inject_h1_if_missing === 'boolean'
              ? inputPb.seo_enhancements.structure_enhancements.inject_h1_if_missing
              : undefined,
            h1_text: typeof inputPb.seo_enhancements.structure_enhancements.h1_text === 'string'
              ? inputPb.seo_enhancements.structure_enhancements.h1_text
              : undefined,
            enhance_title: typeof inputPb.seo_enhancements.structure_enhancements.enhance_title === 'boolean'
              ? inputPb.seo_enhancements.structure_enhancements.enhance_title
              : undefined,
            min_title_length: typeof inputPb.seo_enhancements.structure_enhancements.min_title_length === 'number'
              ? inputPb.seo_enhancements.structure_enhancements.min_title_length
              : undefined,
            title_template: typeof inputPb.seo_enhancements.structure_enhancements.title_template === 'string'
              ? inputPb.seo_enhancements.structure_enhancements.title_template
              : undefined,
          }
        : undefined,
    };
  }
  
  // Validate the fixed config
  const isValid = validator.validate(siteConfigSchema, fixed);
  if (!isValid) {
    const validationErrors = validator.getErrors();
    errors.push(...validationErrors);
  }
  
  return { fixedConfig: fixed, errors, fixes };
}
