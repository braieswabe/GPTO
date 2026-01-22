'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface CreateSiteData {
  domain: string;
  brand: string;
  verticals: string[];
  geo: string[];
}

async function createSite(data: CreateSiteData) {
  // #region agent log
  const tokenFromStorage = localStorage.getItem('token');
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/new/page.tsx:15',message:'createSite called',data:{tokenExists:!!tokenFromStorage,tokenLength:tokenFromStorage?.length||0,tokenValue:tokenFromStorage?tokenFromStorage.substring(0,20)+'...':null,hasBearer:tokenFromStorage?.startsWith('Bearer')||false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const authToken = tokenFromStorage || '';
  const authHeader = `Bearer ${authToken}`;
  
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/new/page.tsx:20',message:'Auth header prepared',data:{authHeaderLength:authHeader.length,authHeaderStartsWithBearer:authHeader.startsWith('Bearer '),tokenIsEmpty:authToken===''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(data),
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/new/page.tsx:30',message:'API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  if (!response.ok) {
    const error = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sites/new/page.tsx:35',message:'API error response',data:{status:response.status,error:error,errorMessage:error.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw new Error(error.error || 'Failed to create site');
  }
  return response.json();
}

function NewSitePageContent() {
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

    let cleanedDomain = '';
    if (!domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else {
      // Strip protocol (http://, https://) and trailing slashes/paths
      cleanedDomain = domain.trim();
      
      // Remove protocol if present
      cleanedDomain = cleanedDomain.replace(/^https?:\/\//i, '');
      
      // Remove trailing slash and any path
      cleanedDomain = cleanedDomain.split('/')[0];
      
      // Remove port if present
      cleanedDomain = cleanedDomain.split(':')[0];
      
      // Updated regex to support subdomains: allows multiple dot-separated parts
      // Pattern: (subdomain.)*domain.tld where each part is alphanumeric with optional hyphens
      const regexPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      
      if (!regexPattern.test(cleanedDomain)) {
        newErrors.domain = 'Please enter a valid domain (e.g., example.com or https://example.com)';
      }
    }

    if (!brand.trim()) {
      newErrors.brand = 'Brand name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Use cleaned domain if validation passed, otherwise use trimmed original
    const finalDomain = cleanedDomain || domain.trim();
    
    createMutation.mutate({
      domain: finalDomain,
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

export default function NewSitePage() {
  return (
    <ProtectedRoute>
      <NewSitePageContent />
    </ProtectedRoute>
  );
}
