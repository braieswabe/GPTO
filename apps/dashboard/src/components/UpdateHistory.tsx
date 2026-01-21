'use client';

import { useQuery } from '@tanstack/react-query';

interface Update {
  id: string;
  fromVersion: string;
  toVersion: string;
  appliedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
}

interface UpdateHistoryProps {
  siteId: string;
}

async function fetchUpdates(siteId: string): Promise<Update[]> {
  const response = await fetch(`/api/sites/${siteId}/updates`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch updates');
  }
  const data = await response.json();
  return data.data || [];
}

export function UpdateHistory({ siteId }: UpdateHistoryProps) {
  const { data: updates, isLoading } = useQuery({
    queryKey: ['updates', siteId],
    queryFn: () => fetchUpdates(siteId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Update History</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse bg-gray-50">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Update History</h3>
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No updates yet</p>
          <p className="text-xs text-gray-400 mt-1">Update history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Update History</h3>
      <div className="space-y-3">
        {updates.map((update) => (
          <div
            key={update.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  <span className="text-gray-600">{update.fromVersion}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-blue-600">{update.toVersion}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(update.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                {update.rolledBackAt ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Rolled Back
                  </span>
                ) : update.appliedAt ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Applied
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
