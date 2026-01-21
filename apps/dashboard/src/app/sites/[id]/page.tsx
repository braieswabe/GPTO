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
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Site not found</h2>
          <Link href="/sites" className="text-blue-600 hover:underline">
            Back to Sites
          </Link>
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
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{data.site.domain}</h1>
          <p className="text-gray-600 mt-2">
            Status: <span className="font-semibold">{data.site.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sites/${siteId}/update`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Propose Update
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Telemetry</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ts.intent" stroke="#8884d8" name="Intent" />
                <Line type="monotone" dataKey="ts.authority" stroke="#82ca9d" name="Authority" />
                <Line type="monotone" dataKey="ts.rank" stroke="#ffc658" name="Rank" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
              <p className="text-gray-500">No telemetry data available</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm font-mono">
              {JSON.stringify(data.config, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div>
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
  );
}
