'use client';

import { useState, useEffect } from 'react';

interface Competitor {
  id: string;
  domain: string;
  name: string;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    overall: number;
  };
  intentSignals: Array<{
    keyword: string;
    score: number;
  }>;
}

interface CompetitorAnalysisProps {
  siteId: string;
}

export default function CompetitorAnalysis({ siteId }: CompetitorAnalysisProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      // In production, would call API
      // const response = await fetch(`/api/competitors/analyze`, { method: 'POST', body: JSON.stringify({ siteId }) });
      // const data = await response.json();
      // setCompetitors(data.analyses);
      
      // Mock data for now
      setCompetitors([]);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitorDomain) return;

    try {
      // In production, would call API
      // await fetch('/api/competitors/add', { method: 'POST', body: JSON.stringify({ siteId, domain: newCompetitorDomain }) });
      setNewCompetitorDomain('');
      fetchCompetitors();
    } catch (error) {
      console.error('Error adding competitor:', error);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, [siteId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competitor Analysis</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="competitor.com"
            value={newCompetitorDomain}
            onChange={(e) => setNewCompetitorDomain(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={addCompetitor}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Competitor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Analyzing competitors...</div>
      ) : competitors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No competitors added yet. Add a competitor to start analysis.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map(competitor => (
            <CompetitorCard key={competitor.id} competitor={competitor} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  const sentimentColor = (score: number) => {
    if (score > 0.6) return 'text-green-600';
    if (score < 0.4) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">{competitor.name}</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Sentiment Analysis</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Overall:</span>
              <span className={sentimentColor(competitor.sentiment.overall)}>
                {(competitor.sentiment.overall * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Positive: {(competitor.sentiment.positive * 100).toFixed(1)}%</span>
              <span>Negative: {(competitor.sentiment.negative * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Top Intent Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {competitor.intentSignals.slice(0, 5).map((signal, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
              >
                {signal.keyword} ({(signal.score * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
