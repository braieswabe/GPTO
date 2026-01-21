'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';

// Placeholder for user role - would come from auth context
const currentUserRole: 'admin' | 'operator' | 'viewer' | 'client' = 'admin';

async function fetchDashboardData() {
  // Would fetch aggregated dashboard data
  return {
    sites: 0,
    telemetryEvents: 0,
    updates: 0,
    authorityDelta: 0,
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h3 className="text-sm text-gray-600">Sites</h3>
          <p className="text-2xl font-bold">{data?.sites || 0}</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="text-sm text-gray-600">Telemetry Events</h3>
          <p className="text-2xl font-bold">{data?.telemetryEvents || 0}</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="text-sm text-gray-600">Updates</h3>
          <p className="text-2xl font-bold">{data?.updates || 0}</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="text-sm text-gray-600">Authority Δ</h3>
          <p className="text-2xl font-bold">{data?.authorityDelta || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/sites"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              View Sites
            </Link>
            <Link
              href="/chat"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              Open PantheraChat
            </Link>
            <RoleBasedAccess
              userRole={currentUserRole}
              allowedRoles={['admin', 'operator']}
            >
              <Link
                href="/sites/new"
                className="block p-3 border rounded hover:bg-gray-50"
              >
                Add New Site
              </Link>
            </RoleBasedAccess>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-gray-500">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
