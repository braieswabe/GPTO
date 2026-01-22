'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';

interface CreateSiteData {
  domain: string;
  brand: string;
  verticals: string[];
  geo: string[];
}

async function createSite(data: CreateSiteData) {
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create site');
  }
  return response.json();
}

export default function NewSitePage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [brand, setBrand] = useState('');
  const [verticals, setVerticals] = useState('');
  const [geo, setGeo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: (data) => {
      router.push(`/sites/${data.data?.id || ''}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(domain)) {
      newErrors.domain = 'Please enter a valid domain';
    }

    if (!brand.trim()) {
      newErrors.brand = 'Brand name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    createMutation.mutate({
      domain: domain.trim(),
      brand: brand.trim(),
      verticals: verticals.split(',').map(v => v.trim()).filter(Boolean),
      geo: geo.split(',').map(g => g.trim()).filter(Boolean),
    });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/sites" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← Back to Sites
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Site</h1>
        <p className="mt-2 text-gray-600">Register a new website to manage with GPTO Suite</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
              Domain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                errors.domain ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
            <p className="mt-1 text-xs text-gray-500">Enter the domain name (e.g., example.com)</p>
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Your Brand"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                errors.brand ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
          </div>

          <div>
            <label htmlFor="verticals" className="block text-sm font-medium text-gray-700 mb-2">
              Verticals
            </label>
            <input
              type="text"
              id="verticals"
              value={verticals}
              onChange={(e) => setVerticals(e.target.value)}
              placeholder="recruitment, trucking, logistics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated list of industry verticals</p>
          </div>

          <div>
            <label htmlFor="geo" className="block text-sm font-medium text-gray-700 mb-2">
              Geographic Regions
            </label>
            <input
              type="text"
              id="geo"
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              placeholder="US, CA, UK"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated list of country codes</p>
          </div>
        </div>

        {createMutation.isError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Failed to create site'}
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Site'}
          </button>
          <Link
            href="/sites"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
