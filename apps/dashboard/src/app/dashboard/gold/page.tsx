'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GoldDashboard } from '@/components/GoldDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@gpto/shared';

interface Site {
  id: string;
  domain: string;
  status?: string | null;
}

function GoldDashboardPageContent() {
  const { user } = useAuth();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Fetch user's accessible sites
  const { data: sitesData } = useQuery<{ data: Site[]; total: number }>({
    queryKey: ['user-sites', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [], total: 0 };
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}/sites`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        return { data: [], total: 0 };
      }

      return response.json();
    },
    enabled: !!user?.id,
  });

  const sites = sitesData?.data || [];

  // Auto-select first site if only one available
  useEffect(() => {
    if (sites.length === 1 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  if (!user) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has client role
  const isClient = user.role === 'client';

  if (!isClient) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Gold Dashboard is only available for client users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              No sites assigned. Please contact your administrator to assign site access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {sites.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Site
            </label>
            <select
              id="site-select"
              value={selectedSiteId || ''}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">-- Select a site --</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.domain}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {selectedSiteId ? (
        <GoldDashboard siteId={selectedSiteId} />
      ) : sites.length === 1 ? (
        <GoldDashboard siteId={sites[0].id} />
      ) : (
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-600">Please select a site to view the Gold Dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoldDashboardPage() {
  return (
    <ProtectedRoute>
      <GoldDashboardPageContent />
    </ProtectedRoute>
  );
}
