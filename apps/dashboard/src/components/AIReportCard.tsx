'use client';

import { useState } from 'react';

interface AIReport {
  executiveSummary: string;
  keyFindings: string[];
  strengths: string[];
  areasForImprovement: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
  nextSteps: string[];
}

interface AIReportCardProps {
  siteId?: string | null;
  timeRange: '7d' | '30d' | 'custom';
}

export function AIReportCard({ siteId, timeRange }: AIReportCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setReport(null);

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/dashboard/ai-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteId: siteId || null,
          range: timeRange,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">AI-Powered Report</h3>
          <p className="text-sm text-gray-600">
            Get an intelligent analysis of all your dashboard data with actionable insights and recommendations.
          </p>
        </div>
      </div>

      {!report && !error && (
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Generate a comprehensive AI-powered report analyzing all your dashboard metrics, visitor behavior, and performance data.
          </p>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Report
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Error generating report</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
              Executive Summary
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{report.executiveSummary}</p>
          </div>

          {/* Key Findings */}
          {report.keyFindings.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                Key Findings
              </h4>
              <ul className="space-y-2">
                {report.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Strengths
              </h4>
              <ul className="space-y-2">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {report.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {report.areasForImprovement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-1">⚠</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                Recommendations
              </h4>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">{rec.title}</h5>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priorityColors[rec.priority]}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Impact:</span> {rec.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {report.nextSteps.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                Next Steps
              </h4>
              <ol className="space-y-2">
                {report.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate New Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
