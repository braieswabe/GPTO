'use client';

import { useEffect, useState } from 'react';
import MonthlyInsights from './MonthlyInsights';

interface CsuiteMetrics {
  authorityScore: {
    current: number;
    trend: number;
    target: number;
  };
  sentimentScore: {
    current: number;
    trend: number;
    target: number;
  };
  competitorRank: {
    position: number;
    total: number;
    trend: number;
  };
  monthlyGrowth: {
    traffic: number;
    authority: number;
    sentiment: number;
  };
}

export default function CsuiteDashboard() {
  const [metrics, setMetrics] = useState<CsuiteMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch C-suite metrics
    const fetchMetrics = async () => {
      try {
        // In production, would call API endpoint
        // For now, use mock data
        setMetrics({
          authorityScore: {
            current: 75,
            trend: 5,
            target: 90,
          },
          sentimentScore: {
            current: 68,
            trend: 3,
            target: 80,
          },
          competitorRank: {
            position: 3,
            total: 10,
            trend: 1,
          },
          monthlyGrowth: {
            traffic: 12.5,
            authority: 8.3,
            sentiment: 4.2,
          },
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Authority Score"
          value={metrics.authorityScore.current}
          target={metrics.authorityScore.target}
          trend={metrics.authorityScore.trend}
          unit="/100"
        />
        <MetricCard
          title="Sentiment Score"
          value={metrics.sentimentScore.current}
          target={metrics.sentimentScore.target}
          trend={metrics.sentimentScore.trend}
          unit="/100"
        />
        <MetricCard
          title="Competitor Rank"
          value={metrics.competitorRank.position}
          total={metrics.competitorRank.total}
          trend={metrics.competitorRank.trend}
          unit={`of ${metrics.competitorRank.total}`}
        />
        <MetricCard
          title="Monthly Growth"
          value={metrics.monthlyGrowth.traffic}
          trend={metrics.monthlyGrowth.authority}
          unit="%"
          isPercentage
        />
      </div>

      {/* Monthly Insights */}
      <MonthlyInsights />

      {/* Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Authority & Sentiment Trends</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Chart visualization would go here
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Competitor Comparison</h2>
        <div className="space-y-2">
          <CompetitorRow rank={1} name="Competitor A" score={85} />
          <CompetitorRow rank={2} name="Competitor B" score={78} />
          <CompetitorRow rank={3} name="Your Site" score={metrics.authorityScore.current} isCurrent />
          <CompetitorRow rank={4} name="Competitor C" score={72} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  target,
  trend,
  unit,
  total,
  isPercentage,
}: {
  title: string;
  value: number;
  target?: number;
  trend: number;
  unit: string;
  total?: number;
  isPercentage?: boolean;
}) {
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-lg text-gray-500 ml-2">{unit}</span>
      </div>
      {target && (
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Target: {target}</span>
            <span className={trendColor}>
              {trendIcon} {Math.abs(trend)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(value / target) * 100}%` }}
            />
          </div>
        </div>
      )}
      {isPercentage && (
        <div className="mt-2 text-sm text-gray-600">
          <span className={trendColor}>
            {trendIcon} {Math.abs(trend)}% vs last month
          </span>
        </div>
      )}
    </div>
  );
}

function CompetitorRow({
  rank,
  name,
  score,
  isCurrent,
}: {
  rank: number;
  name: string;
  score: number;
  isCurrent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded ${
        isCurrent ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center">
        <span className="font-bold w-8">#{rank}</span>
        <span className={isCurrent ? 'font-semibold text-blue-700' : ''}>{name}</span>
      </div>
      <span className="font-semibold">{score}/100</span>
    </div>
  );
}
