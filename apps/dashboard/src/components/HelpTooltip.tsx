'use client';

import { useState } from 'react';

interface HelpTooltipProps {
  term: string;
  explanation: string;
  className?: string;
}

export function HelpTooltip({ term, explanation, className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-label={`What is ${term}?`}
      >
        <svg
          className="h-3.5 w-3.5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none"
          style={{ transform: 'translateX(-50%)', left: '50%' }}
        >
          <div className="font-semibold mb-1.5 text-white capitalize">{term}</div>
          <div className="text-gray-200 leading-relaxed">{explanation}</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </span>
  );
}

// Dictionary of technical terms and their explanations
export const TERM_EXPLANATIONS: Record<string, string> = {
  telemetry:
    'Data about how visitors use your website - what pages they visit, what they search for, and how they interact with your content. Think of it as a visitor log that helps you understand what people are doing.',
  'authority signals':
    'Indicators that show search engines and AI tools that your website is trustworthy and reliable. These include things like trust badges, structured data, and how often your content is referenced.',
  'confusion signals':
    'Warning signs that visitors are having trouble finding what they need - like searching for the same thing multiple times, hitting dead ends, or leaving without finding answers.',
  'coverage gaps':
    'Missing pieces of content that visitors are looking for but can\'t find on your website. These are opportunities to add helpful information.',
  schema:
    'Structured information about your website that helps search engines understand what your pages are about. It\'s like a label system that makes your content easier to find.',
  intent:
    'What visitors are really trying to accomplish when they come to your website - like "find pricing", "get support", or "learn about features".',
  'funnel stages':
    'The steps visitors go through on their journey - from first learning about you (awareness), to considering your solution (consideration), to making a decision (decision), to staying with you (retention).',
  'trust signals':
    'Evidence that your website is credible and reliable - like customer testimonials, security badges, or clear contact information.',
  'confidence gaps':
    'Areas where your website could be more convincing or trustworthy to visitors.',
  blockers:
    'Issues that prevent visitors from trusting or using your website effectively.',
  'structured data':
    'A way of organizing information on your website so search engines can easily understand and display it.',
  'content gaps':
    'Topics or information that visitors are looking for but you haven\'t covered yet on your website.',
  'missing intents':
    'Things visitors want to do on your website that you don\'t have content or pages for yet.',
  'repeated searches':
    'When visitors search for the same thing multiple times, it usually means they couldn\'t find what they were looking for the first time.',
  'dead ends':
    'Pages where visitors land but can\'t find what they need, causing them to leave frustrated.',
  dropoffs:
    'Visitors who leave your website without completing what they came to do.',
  'intent mismatches':
    'When visitors land on a page expecting one thing (like pricing) but find something else (like documentation), causing confusion.',
  'search intents':
    'What visitors are trying to find when they search on your website - like "pricing", "support", or "features".',
  visits:
    'The number of times people come to your website.',
  'top pages':
    'The most popular pages on your website that visitors view the most.',
  trend:
    'How your metrics are changing compared to the previous time period - going up, down, or staying the same.',
  'friction signals':
    'Warning signs that visitors are having trouble using your website effectively.',
  'priority fixes':
    'The most important issues to fix first that will have the biggest impact on your visitors.',
  'authority score':
    'A number from 0-100 that shows how trustworthy and authoritative your website appears to search engines and AI tools.',
  'schema completeness':
    'How well you\'ve labeled and structured your website content so search engines can understand it.',
  'experience health':
    'A measure of how smooth and helpful your website is for visitors - higher scores mean fewer problems.',
  'coverage risk':
    'How likely it is that visitors won\'t find what they\'re looking for on your website.',
  'trust lift':
    'How much your website\'s trustworthiness has improved, measured by how search engines and AI tools view your content.',
};
