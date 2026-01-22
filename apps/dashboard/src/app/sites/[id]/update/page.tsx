'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ConfigEditor } from '@/components/ConfigEditor';
import { DiffView } from '@/components/DiffView';

interface SiteDetail {
  site: {
    id: string;
    domain: string;
  };
  config: unknown;
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

async function proposeUpdate(siteId: string, newConfig: unknown, changeType: string) {
  const response = await fetch(`/api/sites/${siteId}/updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ newConfig, changeType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to propose update');
  }
  return response.json();
}

export default function UpdatePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.id as string;
  const [previewChanges, setPreviewChanges] = useState<unknown>(null);

  const { data: siteData, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSiteDetail(siteId),
  });

  const proposeMutation = useMutation({
    mutationFn: ({ newConfig, changeType }: { newConfig: unknown; changeType: string }) =>
      proposeUpdate(siteId, newConfig, changeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      router.push(`/sites/${siteId}`);
    },
  });

  const handleSubmit = async (newConfig: unknown) => {
    // Calculate preview changes (simplified - would use actual diff API in production)
    setPreviewChanges({ preview: true });
    
    // For now, submit directly
    await proposeMutation.mutateAsync({ newConfig, changeType: 'patch' });
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!siteData) {
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

  return (
    <div className="bg-white min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href={`/sites/${siteId}`} className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← Back to Site
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Update Configuration
        </h1>
        <p className="text-gray-600">{siteData.site.domain}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">New Configuration</h2>
          <ConfigEditor
            initialConfig={siteData.config || {}}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Preview Changes</h2>
          {previewChanges ? (
            <DiffView changes={[]} />
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-gray-500">Make changes to see preview</p>
            </div>
          )}
        </div>
      </div>

      {proposeMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">
            {proposeMutation.error instanceof Error
              ? proposeMutation.error.message
              : 'Failed to propose update'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
