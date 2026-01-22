'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UpdateHistory } from '@/components/UpdateHistory';

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

export default function SiteDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const siteId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSiteDetail(siteId),
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
  const chartData = data.telemetry.map((event) => ({
    timestamp: new Date(event.timestamp).toLocaleTimeString(),
    ...event.metrics,
  }));

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
        <UpdateHistory siteId={siteId} />
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
