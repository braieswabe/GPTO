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
    return <div>Loading update history...</div>;
  }

  if (!updates || updates.length === 0) {
    return <p className="text-gray-500">No updates yet</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Update History</h3>
      <div className="space-y-2">
        {updates.map((update) => (
          <div
            key={update.id}
            className="p-3 border rounded hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">
                  {update.fromVersion} → {update.toVersion}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(update.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-sm">
                {update.rolledBackAt ? (
                  <span className="text-red-600">Rolled Back</span>
                ) : update.appliedAt ? (
                  <span className="text-green-600">Applied</span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
