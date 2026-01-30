'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UpdateHistory } from '@/components/UpdateHistory';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';

function InstallationInstructions({ siteId }: { siteId: string }) {
  const dashboardUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gpto-dashboard.vercel.app';
  const [origin, setOrigin] = useState('https://your-dashboard-url');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const scriptTag = `<script
  src="${origin}/black-box.js"
  data-config-url="${origin}/api/sites/${siteId}/config"
  data-telemetry-url="${origin}/api/telemetry/events"
  data-site-id="${siteId}"
  async
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    alert('Script copied to clipboard!');
  };

  const schemaRenderUrl = `${origin}/api/sites/${siteId}/render`;
  const proxyUrl = `${origin}/api/sites/${siteId}/proxy?url=https://your-domain.com`;

  return (
    <div className="space-y-6 mb-8">
      {/* Client-Side Script Tag */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Step 1: Install Black Box Script (Client-Side)
        </h2>
        <p className="text-sm text-blue-800 mb-4">
          Add this script tag to your website to enable Black Box and telemetry:
        </p>
        <div className="bg-white p-4 rounded border border-blue-200 mb-4">
          <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
{scriptTag}
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          Copy Script Tag
        </button>
      </div>

      {/* Server-Side Schema Injection */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
          <span className="text-xl mr-2">🚀</span>
          Step 2: (Recommended) Add Server-Side Schema Injection
        </h2>
        <p className="text-sm text-purple-800 mb-4">
          For optimal visibility with external audit tools, inject schemas server-side. Schemas update automatically when your configuration changes.
        </p>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Option A: Schema Render Endpoint</h3>
            <p className="text-xs text-gray-600 mb-2">Fetch schemas and inject into your HTML template:</p>
            <div className="bg-gray-900 rounded p-3 mb-2">
              <pre className="text-green-400 text-xs overflow-x-auto">
{`// Next.js / React
const schemas = await fetch('${schemaRenderUrl}');
const schemaHTML = await schemas.text();

// Inject into HTML
<div dangerouslySetInnerHTML={{ __html: schemaHTML }} />`}
              </pre>
            </div>
            <div className="bg-gray-100 rounded p-2">
              <code className="text-xs text-gray-700">{schemaRenderUrl}</code>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Option B: Proxy Endpoint</h3>
            <p className="text-xs text-gray-600 mb-2">Use for external audit tools or testing:</p>
            <div className="bg-gray-100 rounded p-2 mb-2">
              <code className="text-xs text-gray-700 break-all">{proxyUrl}</code>
            </div>
            <p className="text-xs text-gray-600">
              Replace <code className="bg-gray-200 px-1 rounded">your-domain.com</code> with your actual domain.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-800">
            ✅ <strong>Automatic Updates:</strong> Schemas are generated from your configuration and update automatically. No manual HTML edits needed!
          </p>
        </div>
      </div>
    </div>
  );
}

interface SiteDetail {
  site: {
    id: string;
    domain: string;
    status: string;
  };
  config: unknown;
  telemetry: Array<{
    id: string;
    timestamp: string;
    metrics: Record<string, number>;
  }>;
  activeVersion: string | null;
}

async function fetchSiteDetail(id: string): Promise<SiteDetail> {
  const response = await fetch(`/api/sites/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch site');
  }
  return response.json();
}

async function rollbackSite(siteId: string, targetVersion: string) {
  const response = await fetch(`/api/sites/${siteId}/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ targetVersion }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to rollback');
  }
  return response.json();
}

function SiteDetailPageContent() {
  const params = useParams();
  const queryClient = useQueryClient();
  const siteId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSiteDetail(siteId),
    refetchInterval: 300000, // Refresh every 5 minutes (300000ms = 5 minutes)
    refetchOnWindowFocus: true, // Refetch when window regains focus to get latest data
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes (so it refetches before the 5min interval)
  });

  const rollbackMutation = useMutation({
    mutationFn: (targetVersion: string) => rollbackSite(siteId, targetVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Site not found</h2>
            <Link href="/sites" className="text-blue-600 hover:text-blue-700 hover:underline">
              Back to Sites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare telemetry data for chart
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/[id]/page.tsx:149',message:'Preparing chart data',data:{telemetryCount:data.telemetry.length,firstEventMetrics:data.telemetry[0]?.metrics,firstEventKeys:data.telemetry[0]?.metrics?Object.keys(data.telemetry[0].metrics):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const chartData = data.telemetry.map((event) => ({
    timestamp: new Date(event.timestamp).toLocaleTimeString(),
    ...event.metrics,
  }));
  
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/[id]/page.tsx:153',message:'Chart data prepared',data:{chartDataLength:chartData.length,firstChartData:chartData[0],hasTsIntent:chartData[0]?('ts.intent' in chartData[0]):false,hasTsAuthority:chartData[0]?('ts.authority' in chartData[0]):false,hasTsRank:chartData[0]?('ts.rank' in chartData[0]):false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  return (
    <div className="bg-white min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/sites" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← Back to Sites
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.site.domain}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                data.site.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : data.site.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {data.site.status}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/sites/${siteId}/update`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Propose Update
          </Link>
        </div>
      </div>

      {/* Installation Instructions */}
      <InstallationInstructions siteId={siteId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Telemetry</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="ts.intent" stroke="#8884d8" name="Intent" strokeWidth={2} />
                <Line type="monotone" dataKey="ts.authority" stroke="#82ca9d" name="Authority" strokeWidth={2} />
                <Line type="monotone" dataKey="ts.rank" stroke="#ffc658" name="Rank" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500">No telemetry data available</p>
              <p className="text-xs text-gray-400 mt-1">Data will appear here once the site starts receiving events</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Configuration</h2>
          <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 border border-gray-200">
            <pre className="text-sm font-mono text-gray-800">
              {JSON.stringify(data.config, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <UpdateHistory siteId={siteId} activeVersion={data.activeVersion} />
      </div>

      {rollbackMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">
            {rollbackMutation.error instanceof Error
              ? rollbackMutation.error.message
              : 'Failed to rollback'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

export default function SiteDetailPage() {
  return (
    <ProtectedRoute>
      <SiteDetailPageContent />
    </ProtectedRoute>
  );
}
