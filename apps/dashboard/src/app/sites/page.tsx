'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface Site {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
}

async function fetchSites(): Promise<Site[]> {
  try {
    const response = await fetch('/api/sites', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    if (!response.ok) {
      // If unauthorized, return empty array for demo
      return [];
    }
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default function SitesPage() {
  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sites</h1>
        <Link
          href="/sites/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Site
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            Note: Authentication required to view sites. This is a demo view.
          </p>
        </div>
      )}

      {!sites || sites.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sites</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first site.
          </p>
          <div className="mt-6">
            <Link
              href="/sites/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Site
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{site.domain}</h2>
              <p className="text-sm text-gray-500">
                Status:{' '}
                <span
                  className={`font-medium ${
                    site.status === 'active'
                      ? 'text-green-600'
                      : site.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {site.status}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Added {new Date(site.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
