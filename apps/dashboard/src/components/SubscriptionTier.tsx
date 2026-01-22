'use client';

import { useState } from 'react';

interface Tier {
  id: 'bronze' | 'silver' | 'gold';
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 999,
    features: [
      'Schema applied to header + key pages',
      'AI-appraised technical audit',
      'On-site content review',
      '1× competitor telemetry snapshot',
      'Automated PDF + email + scorecard',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 2499,
    features: [
      'Everything in Bronze',
      'Full schema deployment',
      '5-competitor telemetry appraisal',
      'Authority & semantic optimisation plan',
      'Mini Black Box telemetry module',
      'Quarterly re-audit included',
    ],
    popular: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 4999,
    features: [
      'Everything in Silver',
      'Full Panthera Black Box installation',
      'Dynamic schema and live AI SEO',
      '10-competitor + multi-market authority graph',
      'AI-driven link and reputation build',
      'Monthly telemetry insight report',
      'C-suite dashboard access',
    ],
  },
];

interface SubscriptionTierProps {
  currentTier?: 'bronze' | 'silver' | 'gold';
  onSelectTier?: (tier: 'bronze' | 'silver' | 'gold') => void;
}

export default function SubscriptionTier({ currentTier, onSelectTier }: SubscriptionTierProps) {
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'gold' | undefined>(currentTier);

  const handleSelect = (tierId: 'bronze' | 'silver' | 'gold') => {
    setSelectedTier(tierId);
    onSelectTier?.(tierId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map(tier => (
        <div
          key={tier.id}
          className={`relative rounded-lg border-2 p-6 ${
            tier.popular
              ? 'border-blue-500 shadow-lg'
              : selectedTier === tier.id
              ? 'border-blue-300'
              : 'border-gray-200'
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
          )}
          
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold">{tier.name}</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold">${tier.price.toLocaleString()}</span>
              <span className="text-gray-600">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSelect(tier.id)}
            className={`w-full py-2 px-4 rounded ${
              selectedTier === tier.id || tier.popular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {selectedTier === tier.id ? 'Selected' : 'Select Plan'}
          </button>
        </div>
      ))}
    </div>
  );
}
