'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    return <div className="p-8">Loading...</div>;
  }

  if (!siteData) {
    return <div className="p-8">Site not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Update Configuration: {siteData.site.domain}
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">New Configuration</h2>
          <ConfigEditor
            initialConfig={siteData.config || {}}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Preview Changes</h2>
          {previewChanges ? (
            <DiffView changes={[]} />
          ) : (
            <p className="text-gray-500">Make changes to see preview</p>
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
  );
}
