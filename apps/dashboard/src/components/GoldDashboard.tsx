'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

interface GoldDashboardData {
  site: {
    id: string;
    domain: string;
    tier: string;
  };
  period: {
    start: string;
    end: string;
  };
  executiveSignalBar: {
    tier: string;
    assessmentScope: string;
    period: string;
    readinessSignal: string;
  };
  optimisationAxes: {
    technicalReadiness: {
      status: 'Improving' | 'Stable' | 'Constrained';
      pagePerformanceTrends: string;
      crawlIndexNotes: string;
      outstandingBlockers: string[];
      framing: string;
    };
    conversionArchitecture: {
      status: 'Clarifying' | 'Partially Coherent' | 'Fragmented';
      primaryFrictionPoint: string;
      improvementsSinceLastPeriod: string[];
      framing: string;
    };
    contentSignalQuality: {
      status: 'Strengthening' | 'Uneven' | 'Weak';
      authoritySignalDensity: string;
      intentAlignmentNotes: string;
      proofGaps: string[];
      framing: string;
    };
    growthReadiness: {
      status: 'Suitable' | 'Cautious' | 'Not Ready';
      paidAmplificationSuitability: string;
      measurementHooksPresent: boolean;
      scalabilityConstraints: string[];
      framing: string;
    };
  };
  constraintRegister: Array<{
    status: 'Active' | 'Resolved' | 'Emerging';
    constraint: string;
    type: 'Structural' | 'Technical' | 'Messaging' | 'Measurement' | 'External';
  }>;
  changeLog: Array<{
    change: string;
    timestamp: string;
    applied: boolean;
  }>;
  directionalSignals: {
    trafficTrend: '↑' | '→' | '↓';
    engagementNotes: string;
    funnelProgressionSignals: string;
    disclaimer: string;
  } | null;
  riskExpectationControl: string[];
  nextLogicalFocus: string;
}

interface GoldDashboardProps {
  siteId: string;
}

export function GoldDashboard({ siteId }: GoldDashboardProps) {
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchParams = useSearchParams();

  // Track scroll for dynamic header behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rangeQuery = useMemo(() => {
    if (!searchParams) return '';
    const params = new URLSearchParams();
    const range = searchParams.get('range');
    if (range) {
      params.set('range', range);
    } else {
      const start = searchParams.get('start');
      const end = searchParams.get('end');
      if (start) params.set('start', start);
      if (end) params.set('end', end);
    }
    return params.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useQuery<GoldDashboardData>({
    queryKey: ['gold-dashboard', siteId, rangeQuery],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token || ''}`,
      };
      const goldParams = new URLSearchParams(rangeQuery);
      goldParams.set('siteId', siteId);
      const telemetryParams = new URLSearchParams(goldParams);
      telemetryParams.set('refresh', 'true');

      await Promise.allSettled([
        fetch(`/api/dashboard/telemetry?${telemetryParams.toString()}`, { headers }),
        fetch(`/api/dashboard/authority?${telemetryParams.toString()}`, { headers }),
        fetch(`/api/dashboard/confusion?${telemetryParams.toString()}`, { headers }),
        fetch(`/api/dashboard/coverage?${telemetryParams.toString()}`, { headers }),
      ]);

      const response = await fetch(`/api/dashboard/gold?${goldParams.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Gold Dashboard data');
      }

      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // ALL hooks must be called before any conditional returns
  // These useMemo hooks depend on data, so we provide safe defaults
  // Using stable references to avoid hook order issues
  const changeLog = data?.changeLog ?? [];
  const showAllChangesValue = showAllChanges;
  
  const changeLogItems = useMemo(() => {
    if (!changeLog || changeLog.length === 0) return [];
    const ordered = [...changeLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return showAllChangesValue ? ordered : ordered.slice(0, 6);
  }, [changeLog, showAllChangesValue]);

  const technicalReadiness = data?.optimisationAxes?.technicalReadiness;
  const technicalStatus = technicalReadiness?.status ?? '';
  const technicalBlockers = technicalReadiness?.outstandingBlockers ?? [];
  
  const technicalPlainLanguage = useMemo(() => {
    if (!technicalReadiness) return '';
    const status = technicalStatus;
    const blockers = technicalBlockers;

    const statusLine =
      status === 'Improving'
        ? 'The site foundation is getting stronger, and fixes are landing.'
        : status === 'Constrained'
        ? 'The site foundation is under strain, which limits progress.'
        : 'The site foundation is steady, with no major changes.';

    const blockerLine =
      blockers.length > 0
        ? `There ${blockers.length === 1 ? 'is' : 'are'} ${blockers.length} issue${blockers.length === 1 ? '' : 's'} still slowing momentum.`
        : 'No major technical blockers are called out right now.';

    return `${statusLine} ${blockerLine}`;
  }, [technicalReadiness, technicalStatus, technicalBlockers]);

  const conversionArchitecture = data?.optimisationAxes?.conversionArchitecture;
  const conversionStatus = conversionArchitecture?.status ?? '';
  const conversionFriction = conversionArchitecture?.primaryFrictionPoint ?? '';
  const conversionImprovements = conversionArchitecture?.improvementsSinceLastPeriod ?? [];
  
  const conversionPlainLanguage = useMemo(() => {
    if (!conversionArchitecture) return '';
    const status = conversionStatus;
    const friction = conversionFriction;
    const improvements = conversionImprovements;

    const statusLine =
      status === 'Clarifying'
        ? 'The customer journey is becoming clearer, but it is not fully tightened yet.'
        : status === 'Fragmented'
        ? 'The customer journey feels disjointed, which causes drop-off.'
        : 'Parts of the customer journey work, but it is inconsistent.';

    const frictionLine = friction ? `Main customer blocker: ${friction}.` : 'Main customer blocker is not specified.';
    const improvementLine =
      improvements.length > 0
        ? `${improvements.length} improvement${improvements.length === 1 ? '' : 's'} were implemented recently.`
        : 'No recent improvements were recorded this period.';

    return `${statusLine} ${frictionLine} ${improvementLine}`;
  }, [conversionArchitecture, conversionStatus, conversionFriction, conversionImprovements]);

  const contentSignalQuality = data?.optimisationAxes?.contentSignalQuality;
  const contentStatus = contentSignalQuality?.status ?? '';
  const contentProofGaps = contentSignalQuality?.proofGaps ?? [];
  
  const contentPlainLanguage = useMemo(() => {
    if (!contentSignalQuality) return '';
    const status = contentStatus;
    const proofGaps = contentProofGaps;

    const statusLine =
      status === 'Strengthening'
        ? 'Content credibility is improving and aligning better with what people expect.'
        : status === 'Weak'
        ? 'Content does not yet build enough trust or match intent.'
        : 'Some content performs well, but consistency is missing.';

    const proofLine =
      proofGaps.length > 0
        ? `There ${proofGaps.length === 1 ? 'is' : 'are'} ${proofGaps.length} trust gap${proofGaps.length === 1 ? '' : 's'} to address.`
        : 'No major trust gaps were flagged this period.';

    return `${statusLine} ${proofLine}`;
  }, [contentSignalQuality, contentStatus, contentProofGaps]);

  const growthReadiness = data?.optimisationAxes?.growthReadiness;
  const growthStatus = growthReadiness?.status ?? '';
  const growthConstraints = growthReadiness?.scalabilityConstraints ?? [];
  const growthTracking = growthReadiness?.measurementHooksPresent ?? false;
  
  const growthPlainLanguage = useMemo(() => {
    if (!growthReadiness) return '';
    const status = growthStatus;
    const constraints = growthConstraints;
    const tracking = growthTracking;

    const statusLine =
      status === 'Suitable'
        ? 'The foundation can support growth without major waste.'
        : status === 'Not Ready'
        ? 'Scaling now would likely underperform without fixes first.'
        : 'Growth is possible, but it needs careful pacing.';

    const trackingLine = tracking ? 'Tracking is in place to measure outcomes.' : 'Tracking is missing, so results will be hard to measure.';
    const constraintLine =
      constraints.length > 0
        ? `${constraints.length} scale limit${constraints.length === 1 ? '' : 's'} still need attention.`
        : 'No major scale limits were flagged this period.';

    return `${statusLine} ${trackingLine} ${constraintLine}`;
  }, [growthReadiness, growthStatus, growthConstraints, growthTracking]);

  // Now safe to do conditional returns after all hooks
  const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4 sm:space-y-6">
          <div className="h-8 sm:h-10 w-3/4 sm:w-1/2 rounded-lg sm:rounded-xl bg-gray-200"></div>
          <div className="h-24 sm:h-28 rounded-xl sm:rounded-2xl bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 sm:h-48 rounded-xl sm:rounded-2xl bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-2.5 sm:gap-3 text-blue-900">
              <AlertIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium break-words">
                {error instanceof Error ? error.message : 'Failed to load Gold Dashboard data'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusTone = (status: string) => {
    if (status.includes('Improving') || status.includes('Strengthening') || status === 'Suitable' || status === 'Clarifying') {
      return 'text-blue-700 bg-blue-50 border-blue-200 ring-blue-100';
    }
    if (status.includes('Constrained') || status === 'Weak' || status === 'Not Ready' || status === 'Fragmented') {
      return 'text-gray-700 bg-gray-100 border-gray-200 ring-gray-100';
    }
    return 'text-gray-700 bg-gray-50 border-gray-200 ring-gray-100';
  };

  const getConstraintStatusColor = (status: string) => {
    if (status === 'Active') return 'text-blue-700 bg-blue-50 border-blue-200 ring-blue-100';
    if (status === 'Resolved') return 'text-gray-700 bg-gray-50 border-gray-200 ring-gray-100';
    return 'text-blue-600 bg-blue-50 border-blue-200 ring-blue-100';
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const periodLabel = data.period?.start && data.period?.end ? `${formatDate(data.period.start)} - ${formatDate(data.period.end)}` : data.executiveSignalBar.period;

  const requiredDirectionalDisclaimer = 'Signals are directional only and cannot be attributed to GPTO in isolation.';
  const directionalDisclaimer = data.directionalSignals?.disclaimer?.includes(requiredDirectionalDisclaimer)
    ? data.directionalSignals.disclaimer
    : [data.directionalSignals?.disclaimer, requiredDirectionalDisclaimer].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-8 transition-all duration-300">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        {/* Executive Signal Bar (~10%) - No numeric scores, no green/red indicators */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]"></div>
          <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600 text-white shadow-sm flex-shrink-0">
                  <ShieldIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Gold Dashboard</p>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{data.site.domain}</h1>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1">
                  <LayersIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                  <span className="truncate">GPTO Tier: {data.executiveSignalBar.tier}</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1">
                  <SiteIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Site ID </span>
                  <span className="font-mono text-[9px] sm:text-xs truncate max-w-[80px] sm:max-w-none">{data.site.id.slice(0, 8)}...</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1">
                  <CompassIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Assessment Scope: </span>
                  <span className="truncate">{data.executiveSignalBar.assessmentScope}</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1">
                  <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                  <span className="truncate">Period: {periodLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1">
                  <PulseIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Refreshes every 60s</span>
                  <span className="sm:hidden">60s</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-gray-800 w-full lg:w-auto lg:min-w-[280px]">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Current readiness signal</p>
              <p className="text-xs sm:text-sm font-medium leading-tight">{data.executiveSignalBar.readinessSignal}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 italic mt-1">
                This tells you the overall state: are you ready to grow, or are there things to fix first?
              </p>
            </div>
          </div>
        </div>

        {/* 2. Optimisation Axes Snapshot (~35%) */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">The Four Key Areas</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              These four areas determine whether your website can grow effectively. Each shows what's working and what needs attention.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* A. Technical Readiness */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="mt-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white flex-shrink-0">
                  <GaugeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">A. Technical Readiness</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <strong>In plain terms:</strong> Is your website fast, reliable, and easy for search engines to understand?
                  </p>
                </div>
              </div>
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium ring-1 self-start sm:self-auto',
                  getStatusTone(data.optimisationAxes.technicalReadiness.status)
                )}
              >
                <PulseIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="whitespace-nowrap">{data.optimisationAxes.technicalReadiness.status}</span>
              </span>
            </div>
            <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                <TranslateIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Non-technical summary</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">{technicalPlainLanguage}</p>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Technical details</p>
                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <p className="break-words">Page performance trends: {data.optimisationAxes.technicalReadiness.pagePerformanceTrends}</p>
                  <p className="break-words">Crawl/index coverage: {data.optimisationAxes.technicalReadiness.crawlIndexNotes}</p>
                </div>
              </div>
              {data.optimisationAxes.technicalReadiness.outstandingBlockers.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding blockers</p>
                  <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    {data.optimisationAxes.technicalReadiness.outstandingBlockers.map((blocker, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                        <AlertTriangleIcon className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="break-words">{blocker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs sm:text-sm italic text-gray-500 break-words">Framing: "{data.optimisationAxes.technicalReadiness.framing}"</p>
            </div>
          </div>

          {/* B. Conversion Architecture */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="mt-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white flex-shrink-0">
                  <TargetIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">B. Conversion Architecture</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <strong>In plain terms:</strong> Can visitors easily find what they're looking for, or do they get confused and leave?
                  </p>
                </div>
              </div>
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium ring-1 self-start sm:self-auto',
                  getStatusTone(data.optimisationAxes.conversionArchitecture.status)
                )}
              >
                <SignalIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="whitespace-nowrap">{data.optimisationAxes.conversionArchitecture.status}</span>
              </span>
            </div>
            <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                <TranslateIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Non-technical summary</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">{conversionPlainLanguage}</p>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Technical details</p>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 break-words">
                  Primary friction point: {data.optimisationAxes.conversionArchitecture.primaryFrictionPoint}
                </p>
              </div>
              {data.optimisationAxes.conversionArchitecture.improvementsSinceLastPeriod.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">What improved since last period</p>
                  <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    {data.optimisationAxes.conversionArchitecture.improvementsSinceLastPeriod.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                        <CheckIcon className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="break-words">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs sm:text-sm italic text-gray-500 break-words">Framing: "{data.optimisationAxes.conversionArchitecture.framing}"</p>
            </div>
          </div>

          {/* C. Content & Signal Quality */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="mt-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white flex-shrink-0">
                  <PenIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">C. Content & Signal Quality</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <strong>In plain terms:</strong> Does your content build trust and answer what visitors actually need?
                  </p>
                </div>
              </div>
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium ring-1 self-start sm:self-auto',
                  getStatusTone(data.optimisationAxes.contentSignalQuality.status)
                )}
              >
                <SignalIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="whitespace-nowrap">{data.optimisationAxes.contentSignalQuality.status}</span>
              </span>
            </div>
            <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                <TranslateIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Non-technical summary</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">{contentPlainLanguage}</p>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Technical details</p>
                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <p className="break-words">Authority signal density: {data.optimisationAxes.contentSignalQuality.authoritySignalDensity}</p>
                  <p className="break-words">Intent alignment notes: {data.optimisationAxes.contentSignalQuality.intentAlignmentNotes}</p>
                </div>
              </div>
              {data.optimisationAxes.contentSignalQuality.proofGaps.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Gaps in proof or objection handling</p>
                  <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    {data.optimisationAxes.contentSignalQuality.proofGaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                        <AlertTriangleIcon className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="break-words">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs sm:text-sm italic text-gray-500 break-words">Framing: "{data.optimisationAxes.contentSignalQuality.framing}"</p>
            </div>
          </div>

          {/* D. Growth Readiness */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="mt-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white flex-shrink-0">
                  <RocketIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">D. Growth Readiness</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    <strong>In plain terms:</strong> If you spend more on advertising, will your website handle it well?
                  </p>
                </div>
              </div>
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium ring-1 self-start sm:self-auto',
                  getStatusTone(data.optimisationAxes.growthReadiness.status)
                )}
              >
                <SignalIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="whitespace-nowrap">{data.optimisationAxes.growthReadiness.status}</span>
              </span>
            </div>
            <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                <TranslateIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Non-technical summary</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">{growthPlainLanguage}</p>
            </div>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Technical details</p>
                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <p className="break-words">Paid amplification suitability: {data.optimisationAxes.growthReadiness.paidAmplificationSuitability}</p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckBadgeIcon
                      className={cx(
                        'h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0',
                        data.optimisationAxes.growthReadiness.measurementHooksPresent ? 'text-blue-500' : 'text-gray-500'
                      )}
                    />
                    <span className="break-words">Measurement hooks {data.optimisationAxes.growthReadiness.measurementHooksPresent ? 'present' : 'missing'}</span>
                  </div>
                </div>
              </div>
              {data.optimisationAxes.growthReadiness.scalabilityConstraints.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Scalability Constraints</p>
                  <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    {data.optimisationAxes.growthReadiness.scalabilityConstraints.map((constraint, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                        <AlertTriangleIcon className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                        <span className="break-words">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs sm:text-sm italic text-gray-500 break-words">Framing: "{data.optimisationAxes.growthReadiness.framing}"</p>
            </div>
          </div>
        </div>

        {/* 3. Constraint Register (~20%) */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Constraint Register</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 mt-1">
              <strong>What this means:</strong> These are the specific issues that could slow down your growth or cause problems if you try to scale too quickly.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 italic">
              Think of constraints as speed bumps - they don't stop you, but they slow you down until they're fixed.
            </p>
          </div>
          {data.constraintRegister.length === 0 ? (
            <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
              No active constraints identified.
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Constraint</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.constraintRegister.map((constraint, idx) => (
                      <tr key={idx} className="text-xs sm:text-sm text-gray-700">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <span
                            className={cx(
                              'inline-flex items-center gap-1 sm:gap-2 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ring-1',
                              getConstraintStatusColor(constraint.status)
                            )}
                          >
                            <AlertTriangleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {constraint.status}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-900 break-words min-w-[150px]">{constraint.constraint}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-600">{constraint.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">What constraint types mean:</p>
                <ul className="text-[10px] sm:text-xs text-gray-600 space-y-1">
                  <li><strong>Structural:</strong> How your website is organized (navigation, page flow)</li>
                  <li><strong>Technical:</strong> Website speed, reliability, or compatibility issues</li>
                  <li><strong>Messaging:</strong> Content that doesn't match what visitors expect or need</li>
                  <li><strong>Measurement:</strong> Missing tools to track what's working</li>
                  <li><strong>External:</strong> Factors outside your control (market conditions, regulations)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 4. Change Log (~15%) - Audit Trail, Not Results Report */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Change Log</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 mt-1">
                <strong>What this shows:</strong> A record of what was updated on your website during this period.
              </p>
              <p className="text-[10px] sm:text-xs italic text-gray-500">
                This is an audit trail of changes, not a report on results or impact.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllChanges((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 sm:px-3 py-2 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-600 transition-all duration-200 hover:text-gray-900 hover:bg-gray-100 active:scale-95 touch-manipulation"
            >
              <HistoryIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="whitespace-nowrap">{showAllChanges ? 'Show latest only' : 'Show full log'}</span>
            </button>
          </div>
          {data.changeLog.length === 0 ? (
            <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
              No changes recorded in this period.
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              {changeLogItems.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
                  <div className="mt-0.5 sm:mt-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                    {change.applied ? <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" /> : <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{change.change}</p>
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-500">{formatDateTime(change.timestamp)}</p>
                  </div>
                  <span
                    className={cx(
                      'inline-flex items-center rounded-full border px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium flex-shrink-0',
                      change.applied ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                    )}
                  >
                    {change.applied ? 'Applied' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
            <p>Tests or adjustments: Not recorded in this period.</p>
            <p className="mt-1.5 sm:mt-2">What did not change (and why): Not recorded in this period.</p>
            <p className="mt-1.5 sm:mt-2">Impact statements are intentionally excluded.</p>
          </div>
        </div>

        {/* 5. Directional Signals (~10%) - Shown only if data exists */}
        {data.directionalSignals && (
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Directional Signals</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <strong>What this shows:</strong> General trends in website activity. These are <strong>directional only</strong> - they show which way things are moving, but can't tell you exactly why or attribute changes to specific actions.
              </p>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Traffic trend</span>
                </div>
                <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-900">{data.directionalSignals.trafficTrend}</span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {data.directionalSignals.trafficTrend === '↑'
                      ? 'Increasing'
                      : data.directionalSignals.trafficTrend === '↓'
                      ? 'Decreasing'
                      : 'Stable'}
                  </span>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 sm:col-span-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <MessageIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Engagement proxy notes</span>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 break-words">{data.directionalSignals.engagementNotes}</p>
                <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Funnel progression signals</p>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 break-words">{data.directionalSignals.funnelProgressionSignals}</p>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 border-t border-gray-200 pt-3 sm:pt-4 text-[10px] sm:text-xs italic text-gray-500 break-words">{directionalDisclaimer}</p>
          </div>
        )}

        {/* 6. Risk & Expectation Control (~10%) - Gold-Only Section */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Risk & Expectation Control</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-1 mt-1">
                <strong>Why this matters:</strong> These guardrails help set realistic expectations about what optimization can and cannot guarantee.
              </p>
              <p className="text-[10px] sm:text-xs italic text-gray-500">
                Gold-only section - helps protect everyone involved by being clear about limitations
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-gray-600 self-start sm:self-auto">
              <ShieldCheckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Guardrails</span>
            </span>
          </div>
          <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {data.riskExpectationControl.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 p-2.5 sm:p-3 text-xs sm:text-sm text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100">
                <ShieldCheckIcon className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <span className="break-words">{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Next Logical Focus (~5%) - ONE focus only, no roadmap/timeline */}
        <div className="rounded-xl sm:rounded-2xl border border-blue-600 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 p-4 sm:p-6 text-white shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 mb-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 flex-shrink-0">
              <CompassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Next Logical Focus</h3>
              <p className="text-[10px] sm:text-xs text-white/90 mb-1 mt-1">
                <strong>What this means:</strong> Based on everything above, this is the single most important thing to work on next.
              </p>
              <p className="text-[10px] sm:text-xs text-white/70">One focus only - no roadmap or timeline provided</p>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 sm:p-4">
            <p className="text-sm sm:text-base font-semibold text-white break-words">{data.nextLogicalFocus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M3 12h4l2-4 3 8 2-4h7" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M5 16a7 7 0 0 1 14 0" />
      <path d="M12 12l4-4" />
      <path d="M5 16h14" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M5 19l4-1 9-9-3-3-9 9-1 4z" />
      <path d="M14 6l4-1 1 4-3 3-2-2" />
      <path d="M9 15l2 2" />
    </svg>
  );
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M3 12h4" />
      <path d="M9 12h4" />
      <path d="M15 12h6" />
    </svg>
  );
}

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 3l9 16H3l9-16z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M4 16l6-6 4 4 6-6" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M21 14a7 7 0 0 1-7 7H7l-4 3V7a4 4 0 0 1 4-4h7a7 7 0 0 1 7 7z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function TranslateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M4 5h8" />
      <path d="M8 5v2a7 7 0 0 1-3 5" />
      <path d="M5 12h6" />
      <path d="M14 5h6" />
      <path d="M17 5v14" />
      <path d="M14 19h6" />
    </svg>
  );
}

function SiteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <circle cx="7" cy="6.5" r="0.8" fill="currentColor" />
      <circle cx="10" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
