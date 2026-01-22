'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CsuiteDashboard from '@/components/CsuiteDashboard';
import { requireFeature } from '@gpto/tiers';

export default function CsuiteDashboardPage() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has Gold tier access
    // In production, would check subscription tier
    const checkAccess = async () => {
      try {
        // This would check the user's subscription tier
        // For now, assume access if authenticated
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-gray-600">C-Suite Dashboard is only available for Gold tier subscribers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">C-Suite Dashboard</h1>
      <CsuiteDashboard />
    </div>
  );
}
