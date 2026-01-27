'use client';

import { useState, useEffect } from 'react';

interface ConfigEditorProps {
  initialConfig: unknown;
  onSubmit: (config: unknown) => Promise<void>;
  onCancel?: () => void;
  externalConfig?: unknown; // For updates from Panthera
}

// Comprehensive example config with all available features
const EXAMPLE_CONFIG = {
  panthera_blackbox: {
    version: '1.0.0',
    site: {
      domain: 'example.com',
      brand: 'Example Brand',
      verticals: ['technology', 'saas'],
      geo: ['US', 'CA'],
    },
    telemetry: {
      emit: true,
      keys: ['ts.intent', 'ts.authority', 'ts.rank', 'ai.schemaCompleteness', 'ai.searchVisibility'],
    },
    tier: 'bronze',
    authority_grove: {
      node: {
        id: 'https://example.com',
        type: 'Organization',
        name: 'Example Brand',
        sameAs: ['https://twitter.com/example', 'https://linkedin.com/company/example'],
        keywords: ['technology', 'saas', 'ai optimization'],
      },
      partners: [
        {
          id: 'https://partner.com',
          type: 'Organization',
          weight: 0.8,
        },
      ],
      trustEdges: [],
      corroboration: [],
    },
    truthseeker: {
      weights: {
        intent_match: 0.3,
        anchor_match: 0.2,
        authority: 0.25,
        recency: 0.15,
        fairness: 0.1,
      },
    },
    products: [
      {
        name: 'Product Name',
        description: 'Product description here',
      },
    ],
    services: [
      {
        name: 'Service Name',
        description: 'Service description here',
      },
    ],
    faqs: [
      {
        question: 'What is GPTO?',
        answer: 'GPTO is an AI search optimization platform.',
      },
    ],
    seo_enhancements: {
      meta_description: 'Your default meta description for pages that will be injected if missing',
      canonical_enabled: true,
      content_enhancements: {
        enabled: true,
        what: 'We help businesses optimize their online presence for AI search engines like ChatGPT, Perplexity, and Claude.',
        who: 'Our platform is designed for teams, businesses, and companies looking to improve their AI search visibility.',
        how: 'Get started by installing our Black Box runtime, configure your Authority Grove, and watch your scores improve automatically.',
        trust: 'Trusted by leading companies. We maintain security, privacy, and compliance standards including GDPR and SOC 2.',
      },
      content_depth: {
        enabled: true,
        min_h2_count: 6,
        h2_templates: [
          'About Our Platform',
          'Key Features',
          'How It Works',
          'Pricing Plans',
          'Customer Success Stories',
          'Getting Started',
        ],
        content_templates: [
          'Our platform provides comprehensive solutions for AI search optimization, helping businesses improve their visibility in AI-powered search engines.',
          'Key features include automated schema injection, authority signal building, and real-time score tracking.',
          'The platform works seamlessly by injecting structured data and content enhancements that AI models can easily parse and understand.',
          'Flexible pricing plans are available to suit businesses of all sizes, from startups to enterprise organizations.',
          'Join hundreds of satisfied customers who have improved their AI search visibility and increased organic traffic.',
          'Getting started is easy - simply install the Black Box runtime and configure your settings through our intuitive dashboard.',
        ],
        default_content: 'This section provides additional context and information for AI search engines to better understand your content and improve search visibility.',
      },
      structure_enhancements: {
        inject_h1_if_missing: true,
        h1_text: 'Welcome to Example Brand',
        enhance_title: true,
        min_title_length: 30,
        title_template: '{brand} - AI Search Optimization Platform',
      },
    },
    autofill: {
      enabled: true,
      forms: [
        {
          selector: '#contact-form',
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
          id: 'header-ad',
          contexts: ['homepage', 'product'],
        },
      ],
    },
    geo_nodes: {
      enabled: true,
      cities_max: 10,
      attractions_max: 5,
      templates: {
        city: 'Explore {city} with our services',
        attraction: 'Visit {attraction} in {city}',
      },
    },
    policy: {
      privacy_mode: 'anon',
      log_level: 'basic',
    },
  },
};

export function ConfigEditor({ initialConfig, onSubmit, onCancel, externalConfig }: ConfigEditorProps) {
  // Use example config if initialConfig is empty/null/undefined
  const defaultConfig = 
    !initialConfig || 
    (typeof initialConfig === 'object' && Object.keys(initialConfig).length === 0)
      ? EXAMPLE_CONFIG
      : initialConfig;
  
  const [config, setConfig] = useState(() => JSON.stringify(defaultConfig, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update config when externalConfig changes (from Panthera)
  useEffect(() => {
    if (externalConfig) {
      try {
        const configString = JSON.stringify(externalConfig, null, 2);
        setConfig(configString);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error updating config from Panthera:', err);
        setError('Failed to update configuration');
      }
    }
  }, [externalConfig]);

  const handleSubmit = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(config);
      setIsSubmitting(true);
      await onSubmit(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configuration JSON
        </label>
        <textarea
          value={config}
          onChange={(e) => {
            setConfig(e.target.value);
            setError(null);
          }}
          className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 bg-white"
          placeholder={JSON.stringify(EXAMPLE_CONFIG, null, 2)}
        />
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Edit the JSON configuration. Changes will be validated before submission.
        </p>
      </div>
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Propose Update'
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
