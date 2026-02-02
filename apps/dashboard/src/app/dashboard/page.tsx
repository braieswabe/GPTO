'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@gpto/shared';
import { useAuth } from '@/contexts/AuthContext';
import { ScoringMethodology } from '@/components/ScoringMethodology';
import { HelpTooltip, TERM_EXPLANATIONS } from '@/components/HelpTooltip';
import { AIReportCard } from '@/components/AIReportCard';

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

interface DashboardSite {
  id: string;
  domain: string;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface TelemetrySummary {
  totals: {
    visits: number;
    pageViews: number;
    searches: number;
    interactions: number;
  };
  trend: {
    visits: number;
    pageViews: number;
    searches: number;
    interactions: number;
  };
  topPages: Array<{ url: string; count: number }>;
  topIntents: Array<{ intent: string; count: number }>;
}

interface ConfusionSummary {
  totals: {
    repeatedSearches: number;
    deadEnds: number;
    dropOffs: number;
    intentMismatches: number;
  };
  signals: {
    repeatedSearches: Array<{ query: string; count: number; sessionId: string }>;
    deadEnds: Array<{ url: string; at: string; sessionId: string }>;
    dropOffs: Array<{ sessionId: string; lastEvent: string }>;
    intentMismatches: Array<{ url: string; intent: string; expected: string }>;
  };
  confidence: { level: string; score: number };
}

interface AuthoritySummary {
  authorityScore: number;
  trustSignals: Array<{ label: string; value: number }>;
  confidenceGaps: string[];
  blockers: string[];
  confidence: { level: string; score: number };
}

interface SchemaSummary {
  completenessScore: number;
  qualityScore: number;
  missing: number;
  broken: number;
  templates: Array<{ name: string; status: string }>;
}

interface CoverageSummary {
  totals: {
    contentGaps: number;
    missingFunnelStages: number;
    missingIntents: number;
    priorityFixes: number;
  };
  gaps: Array<{ label: string; detail: string; severity: string }>;
  missingStages: string[];
  missingIntents: string[];
  confidence: { level: string; score: number };
}

interface DashboardIndexEntry {
  id: string;
  name: string;
  status: string;
  dataConnected: boolean;
  lastUpdate: string | null;
  confidence: string;
}

interface ExecutiveSummary {
  insights: Array<{ question: string; answer: string | null }>;
}

interface DashboardData {
  sites: number;
  sitesList: DashboardSite[];
  telemetry: TelemetrySummary | null;
  confusion: ConfusionSummary | null;
  authority: AuthoritySummary | null;
  schema: SchemaSummary | null;
  coverage: CoverageSummary | null;
  dashboardIndex: DashboardIndexEntry[];
  executiveSummary: ExecutiveSummary | null;
}

async function fetchDashboardData(range: '7d' | '30d' | 'custom', siteId: string | null = null): Promise<DashboardData> {
  try {
    const token = localStorage.getItem('token') || '';
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const fetchJson = async <T,>(url: string): Promise<T | null> => {
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return response.json();
    };

    const rangeParam = `range=${range}`;
    const siteParam = siteId ? `&siteId=${encodeURIComponent(siteId)}` : '';

    const [
      sitesData,
      telemetryData,
      confusionData,
      authorityData,
      schemaData,
      coverageData,
      indexData,
      executiveData,
    ] = await Promise.all([
      fetchJson<{ data: DashboardSite[] }>('/api/sites'),
      fetchJson<TelemetrySummary>(`/api/dashboard/telemetry?${rangeParam}${siteParam}`),
      fetchJson<ConfusionSummary>(`/api/dashboard/confusion?${rangeParam}${siteParam}`),
      fetchJson<AuthoritySummary>(`/api/dashboard/authority?${rangeParam}${siteParam}`),
      fetchJson<SchemaSummary>(`/api/dashboard/schema?${rangeParam}${siteParam}`),
      fetchJson<CoverageSummary>(`/api/dashboard/coverage?${rangeParam}${siteParam}`),
      fetchJson<{ dashboards: DashboardIndexEntry[] }>(`/api/dashboard/index?${rangeParam}${siteParam}`),
      fetchJson<ExecutiveSummary>(`/api/dashboard/executive-summary?${rangeParam}${siteParam}`),
    ]);

    const sitesList: DashboardSite[] = sitesData?.data || [];
    const sitesCount = sitesList.length;

    return {
      sites: sitesCount,
      sitesList,
      telemetry: telemetryData,
      confusion: confusionData,
      authority: authorityData,
      schema: schemaData,
      coverage: coverageData,
      dashboardIndex: indexData?.dashboards || [],
      executiveSummary: executiveData,
    };
  } catch {
    return {
      sites: 0,
      sitesList: [],
      telemetry: null,
      confusion: null,
      authority: null,
      schema: null,
      coverage: null,
      dashboardIndex: [],
      executiveSummary: null,
    };
  }
}

function NoDataState({ helper, requiresSiteSelection }: { helper?: string; requiresSiteSelection?: boolean }) {
  if (requiresSiteSelection) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white p-5 text-center">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="font-semibold text-blue-700 text-sm">Please select a site</p>
        <p className="mt-1.5 text-xs text-blue-600 leading-relaxed">
          Select a specific site from the dropdown above to view data for this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-5 text-center">
      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-700 text-sm">No data yet</p>
      {helper ? <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{helper}</p> : null}
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  
  // Block client users - they should only access Gold Dashboard
  if (user?.role === 'client') {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Client users can only access the Gold Dashboard. Please use the Gold Dashboard link in the navigation.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const currentUserRole: UserRole = (user?.role as UserRole) || 'viewer';
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'custom'>('30d');
  const [demoMode, setDemoMode] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('Primary');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const canUseDemo = currentUserRole === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', timeRange, selectedSiteId],
    queryFn: () => fetchDashboardData(timeRange, selectedSiteId),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!canUseDemo) {
      setDemoMode(false);
      return;
    }

    const stored = localStorage.getItem('dashboardDemoMode');
    if (stored) {
      setDemoMode(stored === 'true');
    }
  }, [canUseDemo]);

  useEffect(() => {
    if (!canUseDemo) return;
    localStorage.setItem('dashboardDemoMode', String(demoMode));
  }, [demoMode, canUseDemo]);

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const demoSites: DashboardSite[] = [
    { id: 'demo-site-1', domain: 'northwind.com', status: 'active' },
    { id: 'demo-site-2', domain: 'atlashealth.io', status: 'active' },
    { id: 'demo-site-3', domain: 'clearpath.ai', status: 'pending' },
  ];

  const demoData: DashboardData = {
    sites: demoSites.length,
    sitesList: demoSites,
    telemetry: {
      totals: { visits: 48210, pageViews: 61200, searches: 3200, interactions: 14800 },
      trend: { visits: 0.12, pageViews: 0.08, searches: 0.18, interactions: 0.05 },
      topPages: [
        { url: 'https://northwind.com/pricing', count: 8200 },
        { url: 'https://northwind.com/solutions', count: 6400 },
        { url: 'https://northwind.com/docs', count: 4200 },
      ],
      topIntents: [
        { intent: 'pricing', count: 1800 },
        { intent: 'demo', count: 1200 },
        { intent: 'docs', count: 900 },
      ],
    },
    confusion: {
      totals: { repeatedSearches: 18, deadEnds: 7, dropOffs: 12, intentMismatches: 5 },
      signals: {
        repeatedSearches: [{ query: 'refund policy', count: 3, sessionId: 'demo-session-1' }],
        deadEnds: [{ url: 'https://northwind.com/refund', at: new Date().toISOString(), sessionId: 'demo-session-2' }],
        dropOffs: [{ sessionId: 'demo-session-3', lastEvent: new Date().toISOString() }],
        intentMismatches: [{ url: 'https://northwind.com/docs', intent: 'pricing', expected: 'docs' }],
      },
      confidence: { level: 'Medium', score: 62 },
    },
    authority: {
      authorityScore: 74,
      trustSignals: [
        { label: 'Trust content', value: 68 },
        { label: 'Structured data', value: 82 },
      ],
      confidenceGaps: ['Authority signals are below target range.'],
      blockers: ['Schema completeness is limiting trust lift.'],
      confidence: { level: 'Medium', score: 58 },
    },
    schema: {
      completenessScore: 78,
      qualityScore: 74,
      missing: 12,
      broken: 2,
      templates: [
        { name: 'Organization', status: 'available' },
        { name: 'Product', status: 'available' },
        { name: 'FAQ', status: 'available' },
        { name: 'Service', status: 'available' },
      ],
    },
    coverage: {
      totals: { contentGaps: 9, missingFunnelStages: 2, missingIntents: 11, priorityFixes: 4 },
      gaps: [
        { label: 'Missing funnel stages', detail: 'Coverage missing for retention, decision.', severity: 'high' },
      ],
      missingStages: ['retention', 'decision'],
      missingIntents: ['integration', 'security'],
      confidence: { level: 'Medium', score: 60 },
    },
    dashboardIndex: [
      {
        id: 'telemetry',
        name: 'Telemetry',
        status: 'Active',
        dataConnected: true,
        lastUpdate: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        confidence: 'High',
      },
      {
        id: 'confusion',
        name: 'Confusion & mismatch',
        status: 'Active',
        dataConnected: true,
        lastUpdate: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        confidence: 'Medium',
      },
      {
        id: 'authority',
        name: 'Authority & trust',
        status: 'Active',
        dataConnected: true,
        lastUpdate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        confidence: 'Medium',
      },
      {
        id: 'schema',
        name: 'Schema & structure',
        status: 'Active',
        dataConnected: true,
        lastUpdate: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        confidence: 'High',
      },
      {
        id: 'coverage',
        name: 'Coverage & gaps',
        status: 'Active',
        dataConnected: true,
        lastUpdate: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        confidence: 'Medium',
      },
    ],
    executiveSummary: {
      insights: [
        {
          question: 'What\'s working?',
          answer: 'Pricing and onboarding pages drive 62% of conversions with consistent intent match.',
        },
        {
          question: 'What\'s broken?',
          answer: 'Refund-policy searches hit dead ends on three pages, causing drop-offs.',
        },
        {
          question: 'What should we change?',
          answer: 'Clarify plan limits on pricing and add trust proof on checkout.',
        },
        {
          question: 'What should we stop?',
          answer: 'Stop promoting deprecated integration docs that generate mismatched intent.',
        },
        {
          question: 'What should we double down on or sell?',
          answer: 'Double down on industry pages with high authority lift and low confusion.',
        },
      ],
    },
  };

  const resolvedData = demoMode ? demoData : data;
  const sitesList = resolvedData?.sitesList ?? [];
  const hasSites = sitesList.length > 0;
  const telemetry = resolvedData?.telemetry;
  const confusion = resolvedData?.confusion;
  const authority = resolvedData?.authority;
  const schema = resolvedData?.schema;
  const coverage = resolvedData?.coverage;
  const executiveSummary = resolvedData?.executiveSummary;
  const dashboardIndex = resolvedData?.dashboardIndex ?? [];
  const indexMap = new Map(dashboardIndex.map((entry) => [entry.id, entry]));

  const tenantOptions = demoMode ? ['Northwind', 'Atlas', 'Primary'] : ['Primary'];
  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Waiting: 'bg-amber-100 text-amber-700',
    Inactive: 'bg-gray-100 text-gray-600',
  };

  const confidenceStyles: Record<string, string> = {
    High: 'text-emerald-700',
    Medium: 'text-blue-700',
    Low: 'text-amber-700',
    Unknown: 'text-gray-500',
  };

  const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;

  const resolveDashboardMeta = (id: string) => {
    const entry = indexMap.get(id);
    if (entry) {
      return {
        status: entry.status,
        dataConnected: entry.dataConnected,
        lastUpdate: entry.lastUpdate ? getTimeAgo(new Date(entry.lastUpdate)) : 'No data yet',
        confidence: entry.confidence || 'Unknown',
      };
    }
    return {
      status: hasSites ? 'Waiting' : 'Inactive',
      dataConnected: false,
      lastUpdate: 'No data yet',
      confidence: 'Unknown',
    };
  };

  const telemetryHighlights = telemetry && telemetry.totals.pageViews > 0
    ? [
        { label: 'Visits', value: telemetry.totals.visits.toLocaleString() },
        { label: 'Top pages', value: telemetry.topPages.length.toString() },
        { label: 'Search intents', value: telemetry.topIntents.length.toString() },
        { label: 'Trend', value: formatTrend(telemetry.trend.visits) },
      ]
    : [];

  const confusionTotalCount = confusion
    ? confusion.totals.repeatedSearches + confusion.totals.deadEnds + confusion.totals.dropOffs + confusion.totals.intentMismatches
    : 0;

  const confusionHighlights = confusion && confusionTotalCount > 0
    ? [
        { label: 'Repeated searches', value: confusion.totals.repeatedSearches.toString() },
        { label: 'Dead ends', value: confusion.totals.deadEnds.toString() },
        { label: 'Drop-offs', value: confusion.totals.dropOffs.toString() },
        { label: 'Intent mismatches', value: confusion.totals.intentMismatches.toString() },
      ]
    : [];

  const authorityHighlights = authority && authority.authorityScore > 0
    ? [
        { label: 'Authority score', value: `${authority.authorityScore}/100` },
        { label: 'Trust signals', value: authority.trustSignals.length.toString() },
        { label: 'Confidence gaps', value: authority.confidenceGaps.length.toString() },
        { label: 'Blockers', value: authority.blockers.length.toString() },
      ]
    : [];

  const schemaHighlights = schema && (schema.completenessScore > 0 || schema.qualityScore > 0)
    ? [
        { label: 'Completeness', value: `${schema.completenessScore}/100` },
        { label: 'Missing', value: schema.missing.toString() },
        { label: 'Broken', value: schema.broken.toString() },
        { label: 'Templates', value: schema.templates.length.toString() },
      ]
    : [];

  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:462',message:'Building coverage highlights',data:{hasCoverage:!!coverage,contentGaps:coverage?.totals.contentGaps,missingStages:coverage?.totals.missingFunnelStages,missingIntents:coverage?.totals.missingIntents,priorityFixes:coverage?.totals.priorityFixes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const coverageHighlights = coverage
    ? [
        { label: 'Content gaps', value: coverage.totals.contentGaps.toString() },
        { label: 'Missing funnel stages', value: coverage.totals.missingFunnelStages.toString() },
        { label: 'Incomplete intents', value: coverage.totals.missingIntents.toString() },
        { label: 'Priority fixes', value: coverage.totals.priorityFixes.toString() },
      ]
    : [];

  const dashboardCards = [
    {
      id: 'telemetry',
      name: 'Telemetry',
      description: 'See how visitors use your website - what they view, search for, and interact with.',
      explanation: TERM_EXPLANATIONS.telemetry,
      highlights: telemetryHighlights,
      ...resolveDashboardMeta('telemetry'),
    },
    {
      id: 'confusion',
      name: 'Confusion & mismatch',
      description: 'Identify where visitors get stuck or frustrated - repeated searches, dead ends, and mismatched expectations.',
      explanation: TERM_EXPLANATIONS['confusion signals'],
      highlights: confusionHighlights,
      ...resolveDashboardMeta('confusion'),
    },
    {
      id: 'authority',
      name: 'Authority & trust',
      description: 'Measure how trustworthy your website appears to search engines and AI tools.',
      explanation: TERM_EXPLANATIONS['authority signals'],
      highlights: authorityHighlights,
      ...resolveDashboardMeta('authority'),
    },
    {
      id: 'schema',
      name: 'Schema & structure',
      description: 'Check how well your website content is organized so search engines can understand it.',
      explanation: TERM_EXPLANATIONS.schema,
      highlights: schemaHighlights,
      ...resolveDashboardMeta('schema'),
    },
    {
      id: 'coverage',
      name: 'Coverage & gaps',
      description: 'Find missing content that visitors are looking for but can\'t find on your website.',
      explanation: TERM_EXPLANATIONS['coverage gaps'],
      highlights: coverageHighlights,
      ...resolveDashboardMeta('coverage'),
    },
  ];

  const executiveQuestions = executiveSummary?.insights?.length
    ? executiveSummary.insights.map((insight) => ({
        title: insight.question,
        answer: insight.answer || undefined,
      }))
    : [
        { title: "What's working?" },
        { title: "What's broken?" },
        { title: 'What should we change?' },
        { title: 'What should we stop?' },
        { title: 'What should we double down on or sell?' },
      ];

  const mapConfidenceToStatus = (confidence?: string): 'Strong' | 'Watch' | 'Idle' | 'Weak' => {
    if (confidence === 'High') return 'Strong';
    if (confidence === 'Medium') return 'Watch';
    if (confidence === 'Low') return 'Weak';
    return 'Idle';
  };

  const signalChips = [
    {
      label: 'Telemetry',
      explanation: TERM_EXPLANATIONS.telemetry,
      status: mapConfidenceToStatus(indexMap.get('telemetry')?.confidence),
      detail: telemetry ? `${telemetry.totals.pageViews.toLocaleString()} views` : 'No data yet',
    },
    {
      label: 'Confusion',
      explanation: TERM_EXPLANATIONS['confusion signals'],
      status: mapConfidenceToStatus(indexMap.get('confusion')?.confidence),
      detail: confusion ? `${confusion.totals.deadEnds} dead ends` : 'No data yet',
    },
    {
      label: 'Authority',
      explanation: TERM_EXPLANATIONS['authority signals'],
      status: mapConfidenceToStatus(indexMap.get('authority')?.confidence),
      detail: authority ? `Score ${authority.authorityScore}/100` : 'No data yet',
    },
    {
      label: 'Schema',
      explanation: TERM_EXPLANATIONS.schema,
      status: mapConfidenceToStatus(indexMap.get('schema')?.confidence),
      detail: schema ? `Completeness ${schema.completenessScore}/100` : 'No data yet',
    },
    {
      label: 'Coverage',
      explanation: TERM_EXPLANATIONS['coverage gaps'],
      status: mapConfidenceToStatus(indexMap.get('coverage')?.confidence),
      detail: coverage ? `${coverage.totals.contentGaps} gaps` : 'No data yet',
    },
  ];

  const frictionTotal = confusion
    ? confusion.totals.repeatedSearches + confusion.totals.deadEnds + confusion.totals.dropOffs
    : 0;
  const experienceHealth = confusion ? Math.max(0, 100 - Math.min(100, frictionTotal * 2)) : null;
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:561',message:'Calculating coverage risk',data:{hasCoverage:!!coverage,priorityFixes:coverage?.totals.priorityFixes,missingStages:coverage?.totals.missingFunnelStages},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const coverageRisk = coverage
    ? coverage.totals.priorityFixes > 3
      ? 'High'
      : coverage.totals.missingFunnelStages > 0
        ? 'Medium'
        : 'Low'
    : null;

  const pulseCards = [
    telemetry && telemetry.totals.visits > 0
      ? {
          title: 'Revenue impact',
          value: formatTrend(telemetry.trend.visits),
          helper: `${telemetry.totals.visits.toLocaleString()} visits in range`,
          trend: `${formatTrend(telemetry.trend.visits)} vs prior period`,
        }
      : { title: 'Revenue impact' },
    experienceHealth !== null
      ? {
          title: 'Experience health',
          titleExplanation: TERM_EXPLANATIONS['experience health'],
          value: `${experienceHealth}/100`,
          helper: `${frictionTotal} friction signals detected`,
          trend: `${confusion?.confidence.level || 'Low'} confidence`,
        }
      : { title: 'Experience health', titleExplanation: TERM_EXPLANATIONS['experience health'] },
    authority && authority.authorityScore > 0
      ? {
          title: 'Trust lift',
          titleExplanation: TERM_EXPLANATIONS['trust lift'],
          value: `${authority.authorityScore}/100`,
          helper: `${authority.trustSignals.length} trust signals tracked`,
          helperExplanation: TERM_EXPLANATIONS['trust signals'],
          trend: `${authority.confidence.level} confidence`,
          scoringType: 'authority' as const,
        }
      : { title: 'Trust lift', titleExplanation: TERM_EXPLANATIONS['trust lift'] },
    coverage
      ? {
          title: 'Coverage risk',
          titleExplanation: TERM_EXPLANATIONS['coverage risk'],
          value: coverageRisk || 'Low',
          helper: coverage.totals.missingFunnelStages > 0 
            ? `${coverage.totals.missingFunnelStages} stages missing`
            : coverage.totals.contentGaps > 0
              ? `${coverage.totals.contentGaps} gaps detected`
              : 'Coverage complete',
          helperExplanation: coverage.totals.missingFunnelStages > 0 
            ? TERM_EXPLANATIONS['funnel stages']
            : coverage.totals.contentGaps > 0
              ? TERM_EXPLANATIONS['content gaps']
              : undefined,
          trend: `${coverage.confidence.level} confidence`,
        }
      : { title: 'Coverage risk', titleExplanation: TERM_EXPLANATIONS['coverage risk'] },
  ];

  const doubleDownItems = telemetry?.topPages
    ? telemetry.topPages.slice(0, 3).map((page) => page.url)
    : [];
  const fixNowItems = [
    ...(coverage?.gaps || []).slice(0, 2).map((gap) => gap.label),
    ...(confusion?.signals.deadEnds || []).slice(0, 1).map((item) => `Dead end: ${item.url}`),
  ].filter(Boolean);
  const stopItems = (confusion?.signals.repeatedSearches || [])
    .slice(0, 3)
    .map((item) => `Repeated search: ${item.query}`);

  const focusLanes = [
    {
      title: 'Double down',
      description: 'Strong signals to amplify.',
      items: doubleDownItems,
    },
    {
      title: 'Fix now',
      description: 'High friction moments.',
      items: fixNowItems,
    },
    {
      title: 'Stop',
      description: 'Work that is not paying off.',
      items: stopItems,
    },
  ];

  const handleExport = async (format: 'pdf' | 'json', siteId?: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const token = localStorage.getItem('token') || '';
      const exportSiteId = siteId || selectedSiteId || undefined;
      const params = new URLSearchParams({
        format,
        range: timeRange,
        ...(exportSiteId && { siteId: exportSiteId }),
      });
      
      const response = await fetch(`/api/dashboard/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `dashboard-report-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    }
  };

  const momentumItems = telemetry?.topPages?.length
    ? telemetry.topPages.slice(0, 4).map((page) => ({
        label: page.url.replace(/^https?:\/\//, ''),
        count: page.count,
      }))
    : [];
  const momentumMax = momentumItems.reduce((max, item) => Math.max(max, item.count), 1);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Main Dashboard</h1>
              <div className="mt-2 text-base text-gray-600">
                Business answers across <HelpTooltip term="telemetry" explanation={TERM_EXPLANATIONS.telemetry} />, trust, structure, and coverage — no tech jargon.
              </div>
            </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Role</span>
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
              {currentUserRole}
            </span>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard Controls</h2>
              <p className="text-sm text-gray-600 mt-1">
                Switch between clients, choose your time period, and download reports.
              </p>
            </div>
            {canUseDemo ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <span className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Demo mode</span>
                <button
                  type="button"
                  onClick={() => setDemoMode((prev) => !prev)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    demoMode ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-gray-300'
                  }`}
                  aria-pressed={demoMode}
                  aria-label="Toggle demo mode"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                      demoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${demoMode ? 'text-blue-700' : 'text-gray-600'}`}>
                  {demoMode ? 'Demo data' : 'Real data'}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Tenant</p>
              </div>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selectedTenant}
                onChange={(event) => setSelectedTenant(event.target.value)}
              >
                {tenantOptions.map((tenant) => (
                  <option key={tenant} value={tenant}>
                    {tenant}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">Switch between different clients or organizations you manage.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Site</p>
              </div>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selectedSiteId || ''}
                onChange={(event) => setSelectedSiteId(event.target.value || null)}
              >
                <option value="">All Sites</option>
                {sitesList.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.domain}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">Choose a specific website to analyze, or view data for all websites combined.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Time range</p>
              </div>
              <div className="flex gap-2">
                {([
                  { value: '7d', label: '7d' },
                  { value: '30d', label: '30d' },
                  { value: 'custom', label: 'Custom' },
                ] as const).map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setTimeRange(range.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      timeRange === range.value
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Choose how far back to look - last 7 days, 30 days, or a custom date range.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Export</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="flex-1 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:border-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16h10M7 12h10m-7-4h7M5 20h14a1 1 0 001-1V7l-5-4H5a1 1 0 00-1 1v15a1 1 0 001 1z" />
                  </svg>
                  Export PDF
                </button>
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed flex items-center justify-center gap-2"
                  title="Slides export coming soon"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h10M4 6h16M9 6v15m6-15v15M7 21h10" />
                  </svg>
                  Slides
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Download reports as PDF files to share with your team or stakeholders.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-white p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Status</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{hasSites ? resolvedData?.sites : 0}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">Sites connected</p>
              <p className="mt-2 text-xs text-gray-500">Data appears once telemetry and audits run.</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Sites</h3>
              </div>
              <Link href="/sites" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                Manage sites
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {hasSites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sitesList.map((site) => (
                  <div key={site.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md hover:border-blue-300 transition-all group">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{site.domain}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        site.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {site.status ? site.status : 'pending'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Tenant: {selectedTenant}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExport('pdf', site.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16h10M7 12h10m-7-4h7M5 20h14a1 1 0 001-1V7l-5-4H5a1 1 0 00-1 1v15a1 1 0 001 1z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">No sites yet</p>
                <p className="text-xs text-gray-500 mt-1">Add your first site to start collecting data.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Executive Pulse</h2>
              <p className="text-sm text-gray-600">
                A quick overview of how your website is performing - visitor activity, trustworthiness, and content completeness.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 xl:col-span-2 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Business Brief</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    A quick summary of what's working well, what needs fixing, and what you should stop doing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {signalChips.map((chip) => (
                    <SignalChip key={chip.label} {...chip} explanation={chip.explanation} />
                  ))}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {pulseCards.map((card) => (
                  <PulseCard key={card.title} {...card} requiresSiteSelection={!selectedSiteId && !card.value} />
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Momentum Map</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                See which pages are performing well and gaining traction with visitors.
              </p>
              {momentumItems.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {momentumItems.map((item) => {
                    const value = Math.round((item.count / momentumMax) * 100);
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className="text-sm font-bold text-gray-900">{value}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <NoDataState 
                  requiresSiteSelection={!selectedSiteId}
                  helper={selectedSiteId ? "Momentum appears once telemetry, audits, and coverage signals connect." : undefined}
                />
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Focus Lanes</h2>
              <p className="text-sm text-gray-600">
                Action items organized by priority - what to invest more in, what needs fixing, and what to stop doing.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusLanes.map((lane, index) => {
              const colors = [
                { bg: 'from-emerald-50 to-white', border: 'border-emerald-200', dot: 'bg-emerald-500' },
                { bg: 'from-amber-50 to-white', border: 'border-amber-200', dot: 'bg-amber-500' },
                { bg: 'from-rose-50 to-white', border: 'border-rose-200', dot: 'bg-rose-500' },
              ];
              const color = colors[index] || colors[0];
              const laneExplanations: Record<string, string> = {
                'Double down': 'Pages and features that are working well - invest more time and resources here.',
                'Fix now': 'Issues causing visitors to leave frustrated - fix these first for the biggest impact.',
                'Stop': 'Things that aren\'t working and wasting your time - stop doing these.',
              };
              return (
              <div key={lane.title} className={`bg-gradient-to-br ${color.bg} border ${color.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-1">
                    {lane.title}
                    {laneExplanations[lane.title] && (
                      <HelpTooltip term={lane.title.toLowerCase()} explanation={laneExplanations[lane.title]} className="text-xs" />
                    )}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white text-gray-600 border border-gray-200">
                    {lane.items.length || 0}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{lane.description}</p>
                {lane.items.length > 0 ? (
                  <ul className="space-y-2.5">
                    {lane.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2 w-2 rounded-full ${color.dot} flex-shrink-0`} />
                        <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NoDataState 
                    requiresSiteSelection={!selectedSiteId}
                    helper={selectedSiteId ? "Signals will populate once behavioral and audit data are available." : undefined}
                  />
                )}
              </div>
            );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Executive Questions</h2>
            <p className="text-sm text-gray-600">
              What’s working, what’s broken, and where to focus next.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {executiveQuestions.map((question, index) => (
              <div key={question.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                    <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">{question.title}</h3>
                    {question.answer ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{question.answer}</p>
                    ) : (
                      <NoDataState 
                        requiresSiteSelection={!selectedSiteId}
                        helper={selectedSiteId ? "Connect telemetry, audits, and content coverage to unlock this insight." : undefined}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Individual Dashboards</h2>
              <p className="text-sm text-gray-600">
                Detailed views for each area of your website performance, with clear explanations of what each metric means.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardCards.map((card) => (
              <div key={card.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      {card.name}
                      {card.explanation && (
                        <HelpTooltip term={card.name.toLowerCase()} explanation={card.explanation} className="text-xs" />
                      )}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{card.description}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
                      statusStyles[card.status] || statusStyles.Inactive
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                {card.highlights.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {card.highlights.map((metric) => {
                      const explanation = TERM_EXPLANATIONS[metric.label.toLowerCase()] || 
                                         TERM_EXPLANATIONS[metric.label.toLowerCase().replace(/\s+/g, ' ')];
                      return (
                        <div key={metric.label} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5 hover:border-blue-300 transition-colors">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            {metric.label}
                            {explanation && (
                              <HelpTooltip term={metric.label.toLowerCase()} explanation={explanation} className="text-[10px]" />
                            )}
                          </div>
                          <p className="text-lg font-bold text-gray-900 mt-1.5">{metric.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : card.id === 'coverage' && coverage ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3.5">
                      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Status</p>
                      <p className="text-lg font-bold text-emerald-900 mt-1.5">Complete</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</p>
                      <p className="text-lg font-bold text-gray-900 mt-1.5">{coverage.confidence.level}</p>
                    </div>
                  </div>
                ) : (
                  <NoDataState 
                    requiresSiteSelection={!selectedSiteId} 
                    helper={selectedSiteId ? "No dashboard signals are available for this area yet." : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI-Powered Analysis</h2>
              <p className="text-sm text-gray-600">
                Get an intelligent, comprehensive report analyzing all your dashboard data with actionable insights and recommendations.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIReportCard siteId={selectedSiteId} timeRange={timeRange} />
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-3">What's Included</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Executive summary of your website performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Key findings from visitor behavior and metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Identified strengths and areas for improvement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Prioritized recommendations with business impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Actionable next steps you can implement immediately</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-gray-600">
                Reports are generated using AI analysis of all your dashboard data including telemetry, confusion signals, authority metrics, schema coverage, and more.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function SignalChip({
  label,
  status,
  detail,
  explanation,
}: {
  label: string;
  status: 'Strong' | 'Watch' | 'Idle' | 'Weak';
  detail: string;
  explanation?: string;
}) {
  const styles: Record<string, string> = {
    Strong: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Watch: 'bg-amber-100 text-amber-700 border-amber-200',
    Weak: 'bg-rose-100 text-rose-700 border-rose-200',
    Idle: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <div className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${styles[status]} shadow-sm hover:shadow-md transition-shadow flex items-center gap-1`}>
      <span className="font-bold">{label}:</span> {detail}
      {explanation && (
        <HelpTooltip term={label.toLowerCase()} explanation={explanation} className="text-[10px]" />
      )}
    </div>
  );
}

function PulseCard({
  title,
  value,
  helper,
  trend,
  scoringType,
  titleExplanation,
  helperExplanation,
  requiresSiteSelection,
}: {
  title: string;
  value?: string;
  helper?: string;
  trend?: string;
  scoringType?: 'authority' | 'confusion' | 'schema' | 'coverage' | 'telemetry';
  titleExplanation?: string;
  helperExplanation?: string;
  requiresSiteSelection?: boolean;
}) {
  const isPositive = trend?.includes('+') || trend?.toLowerCase().includes('stable');
  const trendColor = isPositive ? 'text-emerald-600' : trend?.toLowerCase().includes('needs') ? 'text-amber-600' : 'text-gray-600';
  
  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-gray-600 font-semibold flex items-center gap-1">
          {title}
          {titleExplanation && (
            <HelpTooltip term={title.toLowerCase()} explanation={titleExplanation} className="text-[10px]" />
          )}
        </div>
        {scoringType && <ScoringMethodology scoreType={scoringType} />}
      </div>
      {value ? (
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend ? (
            <div className="flex items-center gap-1.5 mb-2">
              {isPositive && !trend.toLowerCase().includes('needs') ? (
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : null}
              <p className={`text-xs font-semibold ${trendColor}`}>{trend}</p>
            </div>
          ) : null}
          {helper ? (
            <div className="text-xs text-gray-600 leading-relaxed flex items-center gap-1">
              {helper}
              {helperExplanation && (
                <HelpTooltip term={helper.toLowerCase().split(' ')[0]} explanation={helperExplanation} className="text-[10px]" />
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <NoDataState 
          requiresSiteSelection={requiresSiteSelection}
          helper={requiresSiteSelection ? undefined : "Signals will appear once data is connected."}
        />
      )}
    </div>
  );
}
