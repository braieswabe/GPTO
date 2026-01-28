'use client';

import { useState, useEffect, useRef } from 'react';

interface ScoringMethodologyProps {
  scoreType: 'authority' | 'confusion' | 'schema' | 'coverage' | 'telemetry';
}

export function ScoringMethodology({ scoreType }: ScoringMethodologyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        modalRef.current &&
        buttonRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Close on Escape key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const methodologies = {
    authority: {
      title: 'Authority Score',
      score: '0-100',
      calculation: 'Average of authority metrics from telemetry events',
      components: [
        {
          name: 'ts.authority',
          weight: '40%',
          description: 'Trust signals authority score from telemetry metrics',
          threshold: 'Target: ≥0.6 (60/100)',
        },
        {
          name: 'ai.authoritySignals',
          weight: '30%',
          description: 'AI-detected authority signals and corroboration',
          threshold: 'Target: ≥0.6 (60/100)',
        },
        {
          name: 'ai.schemaCompleteness',
          weight: '30%',
          description: 'Structured data completeness affecting trust',
          threshold: 'Target: ≥0.6 (60/100)',
        },
      ],
      confidence: {
        high: '>500 events',
        medium: '100-500 events',
        low: '1-100 events',
        unknown: '0 events',
      },
      blockers: [
        'Authority signals below 0.6 indicate insufficient trust signals',
        'Insufficient corroboration across authoritative sources',
        'Schema completeness limiting trust lift',
      ],
    },
    confusion: {
      title: 'Confusion Signals',
      score: 'Count-based',
      calculation: 'Aggregate of user friction indicators',
      components: [
        {
          name: 'Repeated Searches',
          weight: 'Equal',
          description: 'Same query searched multiple times in one session',
          threshold: 'Lower is better',
        },
        {
          name: 'Dead Ends',
          weight: 'Equal',
          description: 'Page views with no follow-up event within 60 seconds',
          threshold: 'Lower is better',
        },
        {
          name: 'Drop-offs',
          weight: 'Equal',
          description: 'Sessions with ≤2 events (very short sessions)',
          threshold: 'Lower is better',
        },
        {
          name: 'Intent Mismatches',
          weight: 'Equal',
          description: 'Telemetry intent differs from content inventory intent',
          threshold: 'Lower is better',
        },
      ],
      confidence: {
        high: '>500 events',
        medium: '100-500 events',
        low: '1-100 events',
        unknown: '0 events',
      },
    },
    schema: {
      title: 'Schema Completeness & Quality',
      score: '0-100 each',
      calculation: 'Average of schema metrics from telemetry events',
      components: [
        {
          name: 'Completeness Score',
          weight: '50%',
          description: 'Percentage of pages with structured data (JSON-LD)',
          threshold: 'Target: ≥0.76 (76/100), Missing if <0.6',
        },
        {
          name: 'Quality Score',
          weight: '50%',
          description: 'Quality and correctness of structured data',
          threshold: 'Target: ≥0.6 (60/100), Broken if <0.6',
        },
      ],
      templates: [
        'Organization schema',
        'Product schema',
        'FAQ schema',
        'Service schema',
      ],
    },
    coverage: {
      title: 'Content Coverage',
      score: 'Count-based',
      calculation: 'Gap analysis from content inventory and audits',
      components: [
        {
          name: 'Content Gaps',
          weight: 'Equal',
          description: 'Missing content identified by audit answerability checks',
          threshold: 'Lower is better',
        },
        {
          name: 'Missing Funnel Stages',
          weight: 'Equal',
          description: 'Funnel stages (awareness, consideration, decision, retention) not covered',
          threshold: 'Lower is better',
        },
        {
          name: 'Missing Intents',
          weight: 'Equal',
          description: 'User intents not matched to existing content',
          threshold: 'Lower is better',
        },
        {
          name: 'Priority Fixes',
          weight: 'Equal',
          description: 'High-severity gaps requiring immediate attention',
          threshold: 'Lower is better',
        },
      ],
      confidence: {
        high: 'Audit + inventory data available',
        medium: 'Partial data available',
        low: 'Limited data',
        unknown: 'No data',
      },
    },
    telemetry: {
      title: 'Telemetry Metrics',
      score: 'Count-based',
      calculation: 'Aggregate counts and trends from telemetry events',
      components: [
        {
          name: 'Visits',
          weight: 'N/A',
          description: 'Unique sessions (distinct session_id values)',
          threshold: 'Track trend over time',
        },
        {
          name: 'Page Views',
          weight: 'N/A',
          description: 'Total page_view events',
          threshold: 'Track trend over time',
        },
        {
          name: 'Searches',
          weight: 'N/A',
          description: 'Total search events',
          threshold: 'Track trend over time',
        },
        {
          name: 'Interactions',
          weight: 'N/A',
          description: 'Total interaction events',
          threshold: 'Track trend over time',
        },
      ],
      trend: 'Compared to previous period (7d vs 7d before, or 30d vs 30d before)',
    },
  };

  const method = methodologies[scoreType];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 text-sm underline"
        aria-label="Show scoring methodology"
      >
        How is this scored?
      </button>
      
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-bold text-xl text-gray-900">{method.title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-4 text-sm">
              <div>
                <div className="font-semibold text-gray-700 mb-1">Score Range:</div>
                <div className="text-gray-600">{method.score}</div>
              </div>
              
              <div>
                <div className="font-semibold text-gray-700 mb-1">Calculation:</div>
                <div className="text-gray-600">{method.calculation}</div>
              </div>
              
              <div>
                <div className="font-semibold text-gray-700 mb-3">Components:</div>
                <div className="space-y-3">
                  {method.components.map((comp, idx) => (
                    <div key={idx} className="border-l-3 border-blue-400 pl-4 py-2 bg-blue-50 rounded-r">
                      <div className="font-medium text-gray-900 mb-1">{comp.name}</div>
                      {comp.weight && (
                        <div className="text-xs font-semibold text-blue-700 mb-1">Weight: {comp.weight}</div>
                      )}
                      <div className="text-gray-700 text-xs mb-1">{comp.description}</div>
                      <div className="text-gray-600 text-xs italic">{comp.threshold}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {method.confidence && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold text-gray-700 mb-2">Confidence Levels:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-emerald-700">High:</span> {method.confidence.high}
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Medium:</span> {method.confidence.medium}
                    </div>
                    <div>
                      <span className="font-medium text-amber-700">Low:</span> {method.confidence.low}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Unknown:</span> {method.confidence.unknown}
                    </div>
                  </div>
                </div>
              )}
              
              {method.blockers && (
                <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                  <div className="font-semibold text-gray-700 mb-2">Common Blockers:</div>
                  <ul className="text-xs list-disc list-inside space-y-1 text-gray-700">
                    {method.blockers.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {method.templates && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="font-semibold text-gray-700 mb-2">Available Templates:</div>
                  <div className="text-xs text-gray-700">
                    {method.templates.map((template, idx) => (
                      <span key={idx} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-2 border border-emerald-300">
                        {template}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {method.trend && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="font-semibold text-gray-700 mb-1">Trend Calculation:</div>
                  <div className="text-xs text-gray-700">{method.trend}</div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
