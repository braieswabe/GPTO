'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionTier from '@/components/SubscriptionTier';

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<{
    tier: 'bronze' | 'silver' | 'gold';
    status: string;
    currentPeriodEnd: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSubscription = async () => {
      try {
        // In production, would fetch from API
        // const response = await fetch('/api/subscriptions/current');
        // const data = await response.json();
        // setCurrentSubscription(data.subscription);
        setCurrentSubscription(null); // No subscription yet
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated]);

  const handleSelectTier = async (tier: 'bronze' | 'silver' | 'gold') => {
    try {
      // In production, would call API to create subscription
      // await fetch('/api/subscriptions/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ tier, siteId: '...' }),
      // });
      alert(`Selected ${tier} tier. In production, this would create a Stripe checkout session.`);
    } catch (error) {
      console.error('Error selecting tier:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Please log in to manage your subscription</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>

      {currentSubscription ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Current Subscription</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Tier:</span> {currentSubscription.tier}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {currentSubscription.status}
            </div>
            <div>
              <span className="font-semibold">Renews:</span>{' '}
              {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-gray-700">Select a plan below to get started.</p>
        </div>
      )}

      <SubscriptionTier
        currentTier={currentSubscription?.tier}
        onSelectTier={handleSelectTier}
      />
    </div>
  );
}
