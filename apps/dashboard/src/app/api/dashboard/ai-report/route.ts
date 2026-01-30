import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

/**
 * POST /api/dashboard/ai-report
 * 
 * Generate an AI-powered analytical report using OpenAI
 * Analyzes all dashboard data and provides insights, recommendations, and summarizations
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { siteId, range = '30d' } = body;

    const { start, end, rangeKey } = parseDateRange(
      new URLSearchParams(`range=${range}`)
    );

    // Check if OpenAI API key is configured first
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    let siteIds: string[];
    try {
      siteIds = await getSiteIds(request, siteId);
      if (siteIds.length === 0) {
        return NextResponse.json(
          { error: 'No sites found' },
          { status: 404 }
        );
      }
    } catch (siteError) {
      console.error('Error getting site IDs:', siteError);
      return NextResponse.json(
        { error: 'Failed to get sites', details: siteError instanceof Error ? siteError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Fetch all dashboard data
    const tokenHeader = `Bearer ${token}`;
    const rangeParam = `range=${range}`;
    const siteParam = siteId ? `&siteId=${encodeURIComponent(siteId)}` : '';
    const origin = new URL(request.url).origin;

    try {
      const [
        sitesResponse,
        telemetryResponse,
        confusionResponse,
        authorityResponse,
        schemaResponse,
        coverageResponse,
        executiveResponse,
      ] = await Promise.all([
        fetch(`${origin}/api/sites`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching sites:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/telemetry?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching telemetry:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/confusion?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching confusion:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/authority?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching authority:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/schema?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching schema:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/coverage?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching coverage:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
        fetch(`${origin}/api/dashboard/executive-summary?${rangeParam}${siteParam}`, {
          headers: { Authorization: tokenHeader },
        }).catch(err => {
          console.error('Error fetching executive summary:', err);
          return { ok: false, json: () => Promise.resolve(null) } as Response;
        }),
      ]);

      const [
        sitesData,
        telemetryData,
        confusionData,
        authorityData,
        schemaData,
        coverageData,
        executiveData,
      ] = await Promise.all([
        sitesResponse.ok ? sitesResponse.json().catch(() => null) : null,
        telemetryResponse.ok ? telemetryResponse.json().catch(() => null) : null,
        confusionResponse.ok ? confusionResponse.json().catch(() => null) : null,
        authorityResponse.ok ? authorityResponse.json().catch(() => null) : null,
        schemaResponse.ok ? schemaResponse.json().catch(() => null) : null,
        coverageResponse.ok ? coverageResponse.json().catch(() => null) : null,
        executiveResponse.ok ? executiveResponse.json().catch(() => null) : null,
      ]);

      // Prepare data summary for OpenAI
      const dataSummary = {
        sites: sitesData?.data || [],
        timeRange: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
        telemetry: telemetryData ? {
          visits: telemetryData.totals?.visits || 0,
          pageViews: telemetryData.totals?.pageViews || 0,
          searches: telemetryData.totals?.searches || 0,
          topPages: telemetryData.topPages?.slice(0, 5) || [],
          topIntents: telemetryData.topIntents?.slice(0, 5) || [],
        } : null,
        confusion: confusionData ? {
          repeatedSearches: confusionData.totals?.repeatedSearches || 0,
          deadEnds: confusionData.totals?.deadEnds || 0,
          dropOffs: confusionData.totals?.dropOffs || 0,
          intentMismatches: confusionData.totals?.intentMismatches || 0,
        } : null,
        authority: authorityData ? {
          authorityScore: authorityData.authorityScore || 0,
          trustSignals: authorityData.trustSignals || [],
          confidenceGaps: authorityData.confidenceGaps || [],
          blockers: authorityData.blockers || [],
        } : null,
        schema: schemaData ? {
          completenessScore: schemaData.completenessScore || 0,
          qualityScore: schemaData.qualityScore || 0,
          missing: schemaData.missing || 0,
          broken: schemaData.broken || 0,
        } : null,
        coverage: coverageData ? {
          contentGaps: coverageData.totals?.contentGaps || 0,
          missingFunnelStages: coverageData.totals?.missingFunnelStages || 0,
          missingIntents: coverageData.totals?.missingIntents || 0,
          gaps: coverageData.gaps || [],
        } : null,
        executiveSummary: executiveData?.insights || [],
      };

      // Build prompt for OpenAI
      const prompt = `You are an expert business analyst specializing in website performance and AI search optimization. 

Analyze the following dashboard data and create a comprehensive analytical report with:
1. Executive Summary (2-3 sentences)
2. Key Findings (3-5 bullet points)
3. Strengths (what's working well)
4. Areas for Improvement (what needs attention)
5. Actionable Recommendations (prioritized list)
6. Next Steps (what to do immediately)

Dashboard Data:
${JSON.stringify(dataSummary, null, 2)}

Write the report in clear, non-technical language that business executives can understand. Focus on business impact and actionable insights. Format the response as JSON with the following structure:
{
  "executiveSummary": "string",
  "keyFindings": ["string"],
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "string",
      "description": "string",
      "impact": "string"
    }
  ],
  "nextSteps": ["string"]
}`;

      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        return NextResponse.json(
          { error: 'Failed to generate report', details: errorData.error?.message || 'Unknown error' },
          { status: 500 }
        );
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices?.[0]?.message?.content;

      if (!content) {
        return NextResponse.json(
          { error: 'No content generated from OpenAI' },
          { status: 500 }
        );
      }

      // Parse JSON response (remove markdown code blocks if present)
      let reportData;
      try {
        const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        reportData = JSON.parse(cleanedContent);
      } catch (parseError) {
        // If JSON parsing fails, return the raw content as a fallback
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        reportData = {
          executiveSummary: content,
          keyFindings: [],
          strengths: [],
          areasForImprovement: [],
          recommendations: [],
          nextSteps: [],
        };
      }

      return NextResponse.json({
        success: true,
        report: reportData,
        generatedAt: new Date().toISOString(),
        dataRange: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      });
    } catch (fetchError) {
      console.error('Error fetching dashboard data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating AI report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
