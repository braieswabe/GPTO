'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';

interface SiteReport {
  siteId: string;
  siteName: string;
  range: { start: string; end: string; range: string };
  telemetry?: {
    totals?: { visits?: number; pageViews?: number; searches?: number; interactions?: number };
    trend?: { visits?: number; pageViews?: number; searches?: number; interactions?: number };
    topPages?: Array<{ url: string; count: number }>;
    topIntents?: Array<{ intent: string; count: number }>;
  };
  confusion?: {
    totals?: { repeatedSearches?: number; deadEnds?: number; dropOffs?: number; intentMismatches?: number };
    confidence?: { level?: string; score?: number };
  };
  authority?: {
    authorityScore?: number;
    trustSignals?: Array<{ label: string; value: number }>;
    confidenceGaps?: string[];
    blockers?: string[];
    confidence?: { level?: string; score?: number };
  };
  schema?: {
    completenessScore?: number;
    qualityScore?: number;
    missing?: number;
    broken?: number;
  };
  coverage?: {
    totals?: { contentGaps?: number; missingFunnelStages?: number; missingIntents?: number; priorityFixes?: number };
    confidence?: { level?: string; score?: number };
  };
  executiveSummary?: {
    insights?: Array<{ question: string; answer: string }>;
  };
}

async function fetchSiteReport(siteId: string, range: string = '30d'): Promise<SiteReport> {
  const token = localStorage.getItem('authToken');
  const baseUrl = window.location.origin;
  
  const [telemetry, confusion, authority, schema, coverage, executive, site] = await Promise.all([
    fetch(`${baseUrl}/api/dashboard/telemetry?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/dashboard/confusion?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/dashboard/authority?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/dashboard/schema?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/dashboard/coverage?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/dashboard/executive-summary?siteId=${siteId}&range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
    fetch(`${baseUrl}/api/sites/${siteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
  ]);

  return {
    siteId,
    siteName: site?.domain || siteId,
    range: telemetry?.range || { start: '', end: '', range },
    telemetry: telemetry || undefined,
    confusion: confusion || undefined,
    authority: authority || undefined,
    schema: schema || undefined,
    coverage: coverage || undefined,
    executiveSummary: executive || undefined,
  };
}

export default function SiteReportPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | 'custom'>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['site-report', siteId, timeRange],
    queryFn: () => fetchSiteReport(siteId, timeRange),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="p-8 bg-slate-50 min-h-screen">
          <div className="max-w-7xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute>
        <div className="p-8 bg-slate-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Report not found</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.siteName}</h1>
              <p className="text-gray-600 mt-1">Client Performance Report</p>
            </div>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | 'custom')}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <Link
                href={`/api/dashboard/export?siteId=${siteId}&range=${timeRange}&format=json`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export Report
              </Link>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Authority Score</div>
              <div className="text-3xl font-bold text-gray-900">{data.authority?.authorityScore || 0}/100</div>
              <div className="text-xs text-gray-500 mt-2">
                Confidence: {data.authority?.confidence?.level || 'Unknown'} ({data.authority?.confidence?.score || 0}%)
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Schema Completeness</div>
              <div className="text-3xl font-bold text-gray-900">{data.schema?.completenessScore || 0}/100</div>
              <div className="text-xs text-gray-500 mt-2">
                Quality: {data.schema?.qualityScore || 0}/100
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Confusion Signals</div>
              <div className="text-3xl font-bold text-gray-900">
                {(data.confusion?.totals?.repeatedSearches || 0) + (data.confusion?.totals?.deadEnds || 0) + (data.confusion?.totals?.dropOffs || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {data.confusion?.totals?.repeatedSearches || 0} repeated, {data.confusion?.totals?.deadEnds || 0} dead ends
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Coverage Gaps</div>
              <div className="text-3xl font-bold text-gray-900">{data.coverage?.totals?.contentGaps || 0}</div>
              <div className="text-xs text-gray-500 mt-2">
                {data.coverage?.totals?.missingFunnelStages || 0} missing stages, {data.coverage?.totals?.missingIntents || 0} missing intents
              </div>
            </div>
          </div>

          {/* Telemetry Summary */}
          {data.telemetry && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Telemetry Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Visits</div>
                  <div className="text-2xl font-bold">{(data.telemetry.totals?.visits || 0).toLocaleString()}</div>
                  <div className={`text-xs ${(data.telemetry.trend?.visits || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.telemetry.trend?.visits || 0) >= 0 ? '+' : ''}{((data.telemetry.trend?.visits || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Page Views</div>
                  <div className="text-2xl font-bold">{(data.telemetry.totals?.pageViews || 0).toLocaleString()}</div>
                  <div className={`text-xs ${(data.telemetry.trend?.pageViews || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.telemetry.trend?.pageViews || 0) >= 0 ? '+' : ''}{((data.telemetry.trend?.pageViews || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Searches</div>
                  <div className="text-2xl font-bold">{(data.telemetry.totals?.searches || 0).toLocaleString()}</div>
                  <div className={`text-xs ${(data.telemetry.trend?.searches || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.telemetry.trend?.searches || 0) >= 0 ? '+' : ''}{((data.telemetry.trend?.searches || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Interactions</div>
                  <div className="text-2xl font-bold">{(data.telemetry.totals?.interactions || 0).toLocaleString()}</div>
                  <div className={`text-xs ${(data.telemetry.trend?.interactions || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.telemetry.trend?.interactions || 0) >= 0 ? '+' : ''}{((data.telemetry.trend?.interactions || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          {data.executiveSummary?.insights && data.executiveSummary.insights.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
              <div className="space-y-4">
                {data.executiveSummary.insights.map((insight, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <div className="font-semibold text-gray-900">{insight.question}</div>
                    <div className="text-gray-700 mt-1">{insight.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(!data.executiveSummary?.insights || data.executiveSummary.insights.length === 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No executive insights available yet.</p>
                <p className="text-sm mt-2">Connect telemetry, audits, and content coverage to unlock insights.</p>
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="text-center">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
