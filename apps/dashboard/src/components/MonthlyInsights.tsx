'use client';

import { useEffect, useState } from 'react';

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  impact: string;
  date: Date;
}

export default function MonthlyInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch monthly insights
    const fetchInsights = async () => {
      try {
        // In production, would call API endpoint
        // For now, use mock data
        setInsights([
          {
            id: '1',
            type: 'positive',
            title: 'Authority Score Increased',
            description: 'Your authority score increased by 5 points this month',
            impact: 'High - Improved search visibility',
            date: new Date(),
          },
          {
            id: '2',
            type: 'warning',
            title: 'Competitor Gaining Ground',
            description: 'Competitor B has improved their authority score by 8 points',
            impact: 'Medium - Monitor competitive position',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            type: 'info',
            title: 'New Backlinks Detected',
            description: '15 new backlinks from authoritative domains',
            impact: 'High - Strengthens domain authority',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ]);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Monthly Insights</h2>
        <div className="text-center py-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Monthly Insights</h2>
      <div className="space-y-4">
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeColors = {
    positive: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };

  const typeIcons = {
    positive: '✓',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${typeColors[insight.type]}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{typeIcons[insight.type]}</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{insight.title}</h3>
          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{insight.impact}</span>
            <span className="text-xs text-gray-500">
              {insight.date.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
