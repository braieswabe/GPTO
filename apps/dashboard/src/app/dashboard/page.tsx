'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@gpto/shared';
import { useAuth } from '@/contexts/AuthContext';

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

interface DashboardData {
  sites: number;
  sitesList: DashboardSite[];
  telemetryEvents: number;
  updates: number;
  authorityDelta: number;
  aiSearchScore: number;
  recentActivities: Array<{
    type: 'telemetry' | 'update' | 'audit';
    id: string;
    siteId: string;
    siteDomain?: string;
    timestamp: string;
    description: string;
  }>;
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const token = localStorage.getItem('token') || '';
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const sitesResponse = await fetch('/api/sites', { headers });
    const sitesData = sitesResponse.ok ? await sitesResponse.json() : { data: [] };
    const sitesList: DashboardSite[] = sitesData.data || [];
    const sitesCount = sitesList.length;

    const statsResponse = await fetch('/api/dashboard/stats', { headers });
    const statsData = statsResponse.ok
      ? await statsResponse.json()
      : {
          telemetryEvents: 0,
          updates: 0,
          authorityDelta: 0,
          recentActivities: [],
        };

    let aiSearchScore = 0;
    if (sitesCount > 0 && sitesList.length > 0) {
      try {
        const firstSiteId = sitesList[0]?.id;
        if (firstSiteId) {
          const aiSearchResponse = await fetch(`/api/metrics/ai-search?siteId=${firstSiteId}`, { headers });
          if (aiSearchResponse.ok) {
            const aiSearchData = await aiSearchResponse.json();
            aiSearchScore = aiSearchData.score || 0;
          }
        }
      } catch {
        // Ignore errors, use default
      }
    }

    return {
      sites: sitesCount,
      sitesList,
      telemetryEvents: statsData.telemetryEvents || 0,
      updates: statsData.updates || 0,
      authorityDelta: statsData.authorityDelta || 0,
      aiSearchScore,
      recentActivities: statsData.recentActivities || [],
    };
  } catch {
    return {
      sites: 0,
      sitesList: [],
      telemetryEvents: 0,
      updates: 0,
      authorityDelta: 0,
      aiSearchScore: 0,
      recentActivities: [],
    };
  }
}

function NoDataState({ helper }: { helper?: string }) {
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
  const currentUserRole: UserRole = (user?.role as UserRole) || 'viewer';
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  });

  const [demoMode, setDemoMode] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'custom'>('30d');
  const [selectedTenant, setSelectedTenant] = useState('Primary');

  useEffect(() => {
    const stored = localStorage.getItem('dashboardDemoMode');
    if (stored) {
      setDemoMode(stored === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboardDemoMode', String(demoMode));
  }, [demoMode]);

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
    telemetryEvents: 48210,
    updates: 14,
    authorityDelta: 4.2,
    aiSearchScore: 78,
    recentActivities: [
      {
        type: 'telemetry',
        id: 'demo-activity-1',
        siteId: demoSites[0].id,
        siteDomain: demoSites[0].domain,
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        description: 'Telemetry spike on pricing page',
      },
      {
        type: 'audit',
        id: 'demo-activity-2',
        siteId: demoSites[1].id,
        siteDomain: demoSites[1].domain,
        timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
        description: 'Authority audit completed',
      },
      {
        type: 'update',
        id: 'demo-activity-3',
        siteId: demoSites[2].id,
        siteDomain: demoSites[2].domain,
        timestamp: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
        description: 'Schema template updated',
      },
    ],
  };

  const resolvedData = demoMode ? demoData : data;
  const sitesList = resolvedData?.sitesList ?? [];
  const hasSites = sitesList.length > 0;
  const telemetryEvents = resolvedData?.telemetryEvents ?? 0;
  const hasTelemetryData = telemetryEvents > 0;
  const latestActivity = resolvedData?.recentActivities?.[0];
  const lastUpdateLabel = latestActivity ? getTimeAgo(new Date(latestActivity.timestamp)) : 'No data yet';

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

  const dashboardCards = demoMode
    ? [
        {
          id: 'telemetry',
          name: 'Telemetry',
          description: 'What people are doing once data exists.',
          status: 'Active',
          dataConnected: true,
          lastUpdate: lastUpdateLabel,
          confidence: 'High',
          highlights: [
            { label: 'Visits', value: '48.2k' },
            { label: 'Top pages', value: '12' },
            { label: 'Search intents', value: '36' },
            { label: 'Trend', value: '+12% WoW' },
          ],
        },
        {
          id: 'confusion',
          name: 'Confusion & mismatch',
          description: 'Where users get stuck, loop, or bounce.',
          status: 'Active',
          dataConnected: true,
          lastUpdate: lastUpdateLabel,
          confidence: 'Medium',
          highlights: [
            { label: 'Repeated searches', value: '18' },
            { label: 'Dead ends', value: '7' },
            { label: 'Drop-offs', value: '14%' },
            { label: 'Intent mismatches', value: '5' },
          ],
        },
        {
          id: 'authority',
          name: 'Authority & trust',
          description: 'Trust signals, confidence gaps, and blockers.',
          status: 'Active',
          dataConnected: true,
          lastUpdate: lastUpdateLabel,
          confidence: 'Medium',
          highlights: [
            { label: 'Trust signals', value: '24' },
            { label: 'Confidence gaps', value: '6' },
            { label: 'Conversion blockers', value: '3' },
            { label: 'Authority Δ', value: '+4.2' },
          ],
        },
        {
          id: 'schema',
          name: 'Schema & structure',
          description: 'Structured data coverage and breakage.',
          status: 'Active',
          dataConnected: true,
          lastUpdate: lastUpdateLabel,
          confidence: 'High',
          highlights: [
            { label: 'Structured types', value: '8' },
            { label: 'Missing', value: '12' },
            { label: 'Broken', value: '2' },
            { label: 'Templates', value: '5' },
          ],
        },
        {
          id: 'coverage',
          name: 'Coverage & gaps',
          description: 'Missing content and funnel stages.',
          status: 'Active',
          dataConnected: true,
          lastUpdate: lastUpdateLabel,
          confidence: 'Medium',
          highlights: [
            { label: 'Content gaps', value: '9' },
            { label: 'Missing funnel stages', value: '2' },
            { label: 'Incomplete intents', value: '11' },
            { label: 'Priority fixes', value: '4' },
          ],
        },
      ]
    : [
        {
          id: 'telemetry',
          name: 'Telemetry',
          description: 'What people are doing once data exists.',
          status: hasTelemetryData ? 'Active' : hasSites ? 'Waiting' : 'Inactive',
          dataConnected: hasTelemetryData,
          lastUpdate: hasTelemetryData ? lastUpdateLabel : 'No data yet',
          confidence: hasTelemetryData ? 'Medium' : 'Unknown',
          highlights: hasTelemetryData
            ? [
                { label: 'Telemetry events', value: telemetryEvents.toLocaleString() },
                { label: 'Sites reporting', value: resolvedData?.sites?.toString() ?? '0' },
              ]
            : [],
        },
        {
          id: 'confusion',
          name: 'Confusion & mismatch',
          description: 'Where users get stuck, loop, or bounce.',
          status: hasSites ? 'Waiting' : 'Inactive',
          dataConnected: hasSites,
          lastUpdate: 'No data yet',
          confidence: 'Unknown',
          highlights: [],
        },
        {
          id: 'authority',
          name: 'Authority & trust',
          description: 'Trust signals, confidence gaps, and blockers. No hype, just bounded explanations.',
          status: hasSites ? 'Waiting' : 'Inactive',
          dataConnected: hasSites,
          lastUpdate: 'No data yet',
          confidence: 'Unknown',
          highlights: [],
        },
        {
          id: 'schema',
          name: 'Schema & structure',
          description: 'Structured data coverage and breakage.',
          status: hasSites ? 'Waiting' : 'Inactive',
          dataConnected: hasSites,
          lastUpdate: 'No data yet',
          confidence: 'Unknown',
          highlights: [],
        },
        {
          id: 'coverage',
          name: 'Coverage & gaps',
          description: 'Missing content and funnel stages.',
          status: hasSites ? 'Waiting' : 'Inactive',
          dataConnected: hasSites,
          lastUpdate: 'No data yet',
          confidence: 'Unknown',
          highlights: [],
        },
      ];

  const executiveQuestions = demoMode
    ? [
        {
          title: "What's working?",
          answer: 'Pricing and onboarding pages drive 62% of conversions with consistent intent match.',
        },
        {
          title: "What's broken?",
          answer: 'Refund-policy searches hit dead ends on three pages, causing drop-offs.',
        },
        {
          title: 'What should we change?',
          answer: 'Clarify plan limits on pricing and add trust proof on checkout.',
        },
        {
          title: 'What should we stop?',
          answer: 'Stop promoting deprecated integration docs that generate mismatched intent.',
        },
        {
          title: 'What should we double down on or sell?',
          answer: 'Double down on industry pages with high authority lift and low confusion.',
        },
      ]
    : [
        { title: "What's working?" },
        { title: "What's broken?" },
        { title: 'What should we change?' },
        { title: 'What should we stop?' },
        { title: 'What should we double down on or sell?' },
      ];

  const signalChips = demoMode
    ? [
        { label: 'Telemetry', status: 'Strong', detail: 'High signal' },
        { label: 'Confusion', status: 'Watch', detail: 'Rising loops' },
        { label: 'Authority', status: 'Watch', detail: 'Trust gaps' },
        { label: 'Schema', status: 'Strong', detail: 'Clean coverage' },
        { label: 'Coverage', status: 'Watch', detail: 'Missing stages' },
      ]
    : [
        { label: 'Telemetry', status: 'Idle', detail: 'No data yet' },
        { label: 'Confusion', status: 'Idle', detail: 'No data yet' },
        { label: 'Authority', status: 'Idle', detail: 'No data yet' },
        { label: 'Schema', status: 'Idle', detail: 'No data yet' },
        { label: 'Coverage', status: 'Idle', detail: 'No data yet' },
      ];

  const pulseCards = demoMode
    ? [
        {
          title: 'Revenue impact',
          value: '+$320k',
          helper: 'Attributable to intent-aligned pages',
          trend: '+8% MoM',
        },
        {
          title: 'Experience health',
          value: '84/100',
          helper: 'Drop-offs concentrated in checkout flow',
          trend: '+3 pts',
        },
        {
          title: 'Trust lift',
          value: '+12%',
          helper: 'Proof points added to top 3 pages',
          trend: 'Stable',
        },
        {
          title: 'Coverage risk',
          value: 'Medium',
          helper: 'Missing mid-funnel content',
          trend: 'Needs focus',
        },
      ]
    : [
        { title: 'Revenue impact' },
        { title: 'Experience health' },
        { title: 'Trust lift' },
        { title: 'Coverage risk' },
      ];

  const focusLanes = demoMode
    ? [
        {
          title: 'Double down',
          description: 'Strong signals to amplify.',
          items: ['Pricing clarity', 'AI-ready product pages', 'Partner proof points'],
        },
        {
          title: 'Fix now',
          description: 'High friction moments.',
          items: ['Refund policy dead ends', 'Search intent mismatch on docs', 'Broken schema on FAQ'],
        },
        {
          title: 'Stop',
          description: 'Work that is not paying off.',
          items: ['Deprecated integration pages', 'Low-intent blog topics', 'Duplicated landing pages'],
        },
      ]
    : [
        { title: 'Double down', description: 'Strong signals to amplify.', items: [] },
        { title: 'Fix now', description: 'High friction moments.', items: [] },
        { title: 'Stop', description: 'Work that is not paying off.', items: [] },
      ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Main Dashboard</h1>
            <p className="mt-2 text-base text-gray-600">
              Business answers across telemetry, trust, structure, and coverage — no tech jargon.
            </p>
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
                Switch clients, pick the time window, and export exec-ready reports.
              </p>
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <p className="mt-2 text-xs text-gray-500">Switch between clients/tenants.</p>
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
              <p className="mt-2 text-xs text-gray-500">Compare 7, 30, or custom windows.</p>
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
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  PDF
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Slides
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Export exec-ready reports.</p>
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
                A single read on momentum, trust, and coverage health.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 xl:col-span-2 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Business Brief</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    A fast, executive summary of what to reinforce, repair, or retire.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {signalChips.map((chip) => (
                    <SignalChip key={chip.label} {...chip} />
                  ))}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {pulseCards.map((card) => (
                  <PulseCard key={card.title} {...card} />
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
                Where you are gaining confidence vs. losing momentum.
              </p>
              {demoMode ? (
                <div className="mt-5 space-y-4">
                  {[
                    { label: 'Pricing pages', value: 82 },
                    { label: 'Onboarding flow', value: 68 },
                    { label: 'Docs & support', value: 44 },
                    { label: 'Partner ecosystem', value: 77 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NoDataState helper="Momentum appears once telemetry, audits, and coverage signals connect." />
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
                Decisions grouped by what to scale, fix, or stop.
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
              return (
              <div key={lane.title} className={`bg-gradient-to-br ${color.bg} border ${color.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">{lane.title}</h3>
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
                  <NoDataState helper="Signals will populate once behavioral and audit data are available." />
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
                      <NoDataState helper="Connect telemetry, audits, and content coverage to unlock this insight." />
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
                Each dashboard is scoped to a business question and explains outcomes without hype.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardCards.map((card) => (
              <div key={card.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{card.name}</h3>
                    <p className="mt-1 text-xs text-gray-600">{card.description}</p>
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
                    {card.highlights.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5 hover:border-blue-300 transition-colors">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric.label}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1.5">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <NoDataState helper="No dashboard signals are available for this area yet." />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg shadow-slate-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard Index</h2>
              <p className="text-sm text-gray-600">
                Master control panel showing activation, data connection, last update, and confidence.
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white text-xs uppercase tracking-wide text-gray-600 font-semibold">
              <div className="px-5 py-4">Dashboard</div>
              <div className="px-5 py-4">Status</div>
              <div className="px-5 py-4">Data connected</div>
              <div className="px-5 py-4">Last update</div>
              <div className="px-5 py-4">Confidence</div>
            </div>
            {dashboardCards.map((card, index) => (
              <div
                key={card.id}
                className={`grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-100 text-sm hover:bg-gray-50 transition-colors ${
                  index === dashboardCards.length - 1 ? '' : ''
                }`}
              >
                <div className="px-5 py-4 text-gray-900 font-semibold">{card.name}</div>
                <div className="px-5 py-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
                      statusStyles[card.status] || statusStyles.Inactive
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <div className="px-5 py-4 text-gray-600">
                  <span className={`inline-flex items-center gap-1.5 ${card.dataConnected ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {card.dataConnected ? (
                      <>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Connected
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Not connected
                      </>
                    )}
                  </span>
                </div>
                <div className="px-5 py-4 text-gray-600 font-medium">{card.lastUpdate}</div>
                <div className={`px-5 py-4 font-semibold ${confidenceStyles[card.confidence] || 'text-gray-500'}`}>
                  {card.confidence}
                </div>
              </div>
            ))}
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
}: {
  label: string;
  status: 'Strong' | 'Watch' | 'Idle' | 'Weak';
  detail: string;
}) {
  const styles: Record<string, string> = {
    Strong: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Watch: 'bg-amber-100 text-amber-700 border-amber-200',
    Weak: 'bg-rose-100 text-rose-700 border-rose-200',
    Idle: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <div className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${styles[status]} shadow-sm hover:shadow-md transition-shadow`}>
      <span className="font-bold">{label}:</span> {detail}
    </div>
  );
}

function PulseCard({
  title,
  value,
  helper,
  trend,
}: {
  title: string;
  value?: string;
  helper?: string;
  trend?: string;
}) {
  const isPositive = trend?.includes('+') || trend?.toLowerCase().includes('stable');
  const trendColor = isPositive ? 'text-emerald-600' : trend?.toLowerCase().includes('needs') ? 'text-amber-600' : 'text-gray-600';
  
  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-md transition-all">
      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-3">{title}</p>
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
          {helper ? <p className="text-xs text-gray-600 leading-relaxed">{helper}</p> : null}
        </div>
      ) : (
        <NoDataState helper="Signals will appear once data is connected." />
      )}
    </div>
  );
}
