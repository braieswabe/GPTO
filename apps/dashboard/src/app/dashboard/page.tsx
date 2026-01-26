'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@gpto/shared';
import { useAuth } from '@/contexts/AuthContext';

async function fetchDashboardData() {
  try {
    // Fetch sites count
    const sitesResponse = await fetch('/api/sites', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const sitesData = sitesResponse.ok ? await sitesResponse.json() : { data: [] };
    const sitesCount = sitesData.data?.length || 0;

    // For now, return mock data for other metrics
    // In production, these would come from dedicated endpoints
    // Fetch AI search visibility score
    // Note: This endpoint requires a siteId, so we'll calculate an aggregate if we have sites
    let aiSearchScore = 0;
    if (sitesCount > 0 && sitesData.data?.length > 0) {
      try {
        // Use the first site's ID for now, or calculate aggregate across all sites
        const firstSiteId = sitesData.data[0]?.id;
        if (firstSiteId) {
          const aiSearchResponse = await fetch(`/api/metrics/ai-search?siteId=${firstSiteId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
          });
          if (aiSearchResponse.ok) {
            const aiSearchData = await aiSearchResponse.json();
            aiSearchScore = aiSearchData.score || 0;
          }
        }
      } catch {
        // Ignore errors, use default
      }
    }

    return {
      sites: sitesCount,
      telemetryEvents: 0,
      updates: 0,
      authorityDelta: 0,
      aiSearchScore,
    };
  } catch {
      return {
        sites: 0,
        telemetryEvents: 0,
        updates: 0,
        authorityDelta: 0,
        aiSearchScore: 0,
      };
  }
}

function DashboardContent() {
  const { user } = useAuth();
  const currentUserRole: UserRole = (user?.role as UserRole) || 'viewer';
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="p-8 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your GPTO Suite</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sites</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.sites || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Telemetry Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.telemetryEvents || 0}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Updates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.updates || 0}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Authority Δ</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.authorityDelta || 0}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Search Visibility</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.aiSearchScore || 0}/100</p>
              <p className="text-xs text-gray-500 mt-1">Schema completeness & authority</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/sites"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
            >
              <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="font-medium text-gray-700 group-hover:text-blue-600">View All Sites</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
            >
              <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium text-gray-700 group-hover:text-blue-600">Open PantheraChat</span>
            </Link>
            <RoleBasedAccess
              userRole={currentUserRole}
              allowedRoles={['admin', 'operator']}
            >
              <Link
                href="/sites/new"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
              >
                <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Add New Site</span>
              </Link>
            </RoleBasedAccess>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Activity</h2>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activity will appear here as you use the system</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
