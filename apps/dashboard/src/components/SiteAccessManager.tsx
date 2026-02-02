'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Site {
  id: string;
  domain: string;
  status?: string | null;
}

interface SiteAccessManagerProps {
  userId: string;
  currentSiteIds: string[];
  onUpdate?: () => void;
}

export function SiteAccessManager({ userId, currentSiteIds, onUpdate }: SiteAccessManagerProps) {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(currentSiteIds);
  const queryClient = useQueryClient();

  // Fetch all available sites
  const { data: allSitesData, isLoading: sitesLoading } = useQuery<{ data: Site[]; total: number }>({
    queryKey: ['all-sites'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sites', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      return response.json();
    },
  });

  const allSites = allSitesData?.data || [];

  // Update selected sites when currentSiteIds changes
  useEffect(() => {
    setSelectedSiteIds(currentSiteIds);
  }, [currentSiteIds]);

  // Assign sites mutation
  const assignMutation = useMutation({
    mutationFn: async (siteIds: string[]) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ siteIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign site access');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sites', userId] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      onUpdate?.();
    },
  });

  // Remove sites mutation
  const removeMutation = useMutation({
    mutationFn: async (siteIds: string[]) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/sites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ siteIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove site access');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sites', userId] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      onUpdate?.();
    },
  });

  const handleSiteToggle = (siteId: string) => {
    if (selectedSiteIds.includes(siteId)) {
      setSelectedSiteIds(selectedSiteIds.filter((id) => id !== siteId));
    } else {
      setSelectedSiteIds([...selectedSiteIds, siteId]);
    }
  };

  const handleSave = async () => {
    const toAdd = selectedSiteIds.filter((id) => !currentSiteIds.includes(id));
    const toRemove = currentSiteIds.filter((id) => !selectedSiteIds.includes(id));

    try {
      if (toAdd.length > 0) {
        await assignMutation.mutateAsync(toAdd);
      }
      if (toRemove.length > 0) {
        await removeMutation.mutateAsync(toRemove);
      }
    } catch (error) {
      console.error('Error updating site access:', error);
    }
  };

  const hasChanges = JSON.stringify([...selectedSiteIds].sort()) !== JSON.stringify([...currentSiteIds].sort());
  const isLoading = assignMutation.isPending || removeMutation.isPending;

  if (sitesLoading) {
    return <div className="text-sm text-gray-600">Loading sites...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
        {allSites.length === 0 ? (
          <p className="text-sm text-gray-600">No sites available</p>
        ) : (
          <div className="space-y-2">
            {allSites.map((site) => {
              const isSelected = selectedSiteIds.includes(site.id);
              return (
                <label
                  key={site.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSiteToggle(site.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{site.domain}</span>
                    {site.status && (
                      <span className="ml-2 text-xs text-gray-500">({site.status})</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedSiteIds.length} of {allSites.length} sites selected
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSiteIds(currentSiteIds)}
            disabled={!hasChanges || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {(assignMutation.isError || removeMutation.isError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            {assignMutation.error instanceof Error
              ? assignMutation.error.message
              : removeMutation.error instanceof Error
              ? removeMutation.error.message
              : 'An error occurred'}
          </p>
        </div>
      )}
    </div>
  );
}
