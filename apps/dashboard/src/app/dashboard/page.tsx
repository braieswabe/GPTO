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
    <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      <p className="font-medium text-gray-700">No data yet</p>
      {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
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

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Main Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Business answers across telemetry, trust, structure, and coverage — no tech jargon.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-gray-500">Role</span>
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {currentUserRole}
            </span>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dashboard shell</h2>
              <p className="text-sm text-gray-600">
                Switch clients, pick the time window, and export exec-ready reports.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-gray-500">Demo mode</span>
              <button
                type="button"
                onClick={() => setDemoMode((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  demoMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={demoMode}
                aria-label="Toggle demo mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    demoMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-500">{demoMode ? 'Demo data' : 'Real data'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Tenant</p>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Time range</p>
              <div className="flex gap-2">
                {([
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: 'custom', label: 'Custom' },
                ] as const).map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                      timeRange === range.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Compare 7, 30, or custom windows.</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Export</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  PDF
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Slides
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Export exec-ready reports.</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Status</p>
              <p className="text-2xl font-semibold text-gray-900">{hasSites ? resolvedData?.sites : 0}</p>
              <p className="text-sm text-gray-600">Sites connected</p>
              <p className="mt-2 text-xs text-gray-500">Data appears once telemetry and audits run.</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Sites</h3>
              <Link href="/sites" className="text-xs text-blue-600 hover:text-blue-700">
                Manage sites
              </Link>
            </div>
            {hasSites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sitesList.map((site) => (
                  <div key={site.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{site.domain}</p>
                      <span className="text-xs text-gray-500">
                        {site.status ? site.status : 'pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Tenant: {selectedTenant}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sites yet. Add your first site to start collecting data.</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Executive questions</h2>
            <p className="text-sm text-gray-600">
              What’s working, what’s broken, and where to focus next.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {executiveQuestions.map((question) => (
              <div key={question.title} className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900">{question.title}</h3>
                {question.answer ? (
                  <p className="mt-3 text-sm text-gray-700">{question.answer}</p>
                ) : (
                  <NoDataState helper="Connect telemetry, audits, and content coverage to unlock this insight." />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Individual dashboards</h2>
            <p className="text-sm text-gray-600">
              Each dashboard is scoped to a business question and explains outcomes without hype.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardCards.map((card) => (
              <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{card.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{card.description}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusStyles[card.status] || statusStyles.Inactive
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                {card.highlights.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {card.highlights.map((metric) => (
                      <div key={metric.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">{metric.label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{metric.value}</p>
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dashboard index</h2>
            <p className="text-sm text-gray-600">
              Master control panel showing activation, data connection, last update, and confidence.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <div className="px-4 py-3">Dashboard</div>
              <div className="px-4 py-3">Status</div>
              <div className="px-4 py-3">Data connected</div>
              <div className="px-4 py-3">Last update</div>
              <div className="px-4 py-3">Confidence</div>
            </div>
            {dashboardCards.map((card) => (
              <div
                key={card.id}
                className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-b border-gray-100 text-sm"
              >
                <div className="px-4 py-3 text-gray-900 font-medium">{card.name}</div>
                <div className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusStyles[card.status] || statusStyles.Inactive
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <div className="px-4 py-3 text-gray-600">
                  {card.dataConnected ? 'Connected' : 'Not connected'}
                </div>
                <div className="px-4 py-3 text-gray-600">{card.lastUpdate}</div>
                <div className={`px-4 py-3 font-medium ${confidenceStyles[card.confidence] || ''}`}>
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
