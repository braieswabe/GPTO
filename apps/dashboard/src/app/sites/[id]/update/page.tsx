'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ConfigEditor } from '@/components/ConfigEditor';
import { DiffView } from '@/components/DiffView';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PantheraConfigAssistant } from '@/components/PantheraConfigAssistant';

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
    const errorMessage = error.details 
      ? `${error.error}\n\nDetails:\n${Array.isArray(error.details) ? error.details.join('\n') : JSON.stringify(error.details, null, 2)}`
      : error.error || 'Failed to propose update';
    throw new Error(errorMessage);
  }
  return response.json();
}

function UpdatePageContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.id as string;
  const [previewChanges, setPreviewChanges] = useState<unknown>(null);
  const [currentConfig, setCurrentConfig] = useState<unknown>(null);

  const { data: siteData, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSiteDetail(siteId),
  });

  // Update currentConfig when siteData loads
  useEffect(() => {
    if (siteData?.config) {
      setCurrentConfig(siteData.config);
    }
  }, [siteData]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">New Configuration</h2>
          <ConfigEditor
            initialConfig={siteData.config || {}}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            externalConfig={currentConfig}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ minHeight: '600px' }}>
          <PantheraConfigAssistant
            currentConfig={currentConfig || siteData.config || {}}
            onConfigRevised={(revisedConfig) => {
              setCurrentConfig(revisedConfig);
            }}
          />
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

export default function UpdatePage() {
  return (
    <ProtectedRoute>
      <UpdatePageContent />
    </ProtectedRoute>
  );
}
