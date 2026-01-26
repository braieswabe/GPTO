import { NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, desc } from 'drizzle-orm';
import { runTechnicalAudit } from '@gpto/audit';

/**
 * Calculate AI search visibility score for a site
 * GET /api/metrics/ai-search?siteId=<siteId>
 */
export async function GET(request: Request) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/metrics/ai-search/route.ts:11',message:'AI search metrics request started',data:{url:request.url,hasSearchParams:!!new URL(request.url).searchParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/metrics/ai-search/route.ts:15',message:'SiteId extracted from query params',data:{siteId,allParams:Object.fromEntries(searchParams.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!siteId) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/metrics/ai-search/route.ts:19',message:'Missing siteId parameter',data:{url:request.url,searchParams:Object.fromEntries(searchParams.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'siteId parameter is required' },
        { status: 400 }
      );
    }

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Run technical audit to get AI search optimization metrics
    const auditResult = await runTechnicalAudit(siteId);
    
    // Extract AI search optimization score and metrics
    const aiSearchOptimization = auditResult.aiSearchOptimization;
    
    if (!aiSearchOptimization) {
      return NextResponse.json(
        { error: 'AI search optimization data not available' },
        { status: 500 }
      );
    }

    // Return score and detailed metrics
    return NextResponse.json({
      score: aiSearchOptimization.score,
      metrics: aiSearchOptimization.metrics,
      issues: aiSearchOptimization.issues.length,
      recommendations: aiSearchOptimization.recommendations.length,
    });
  } catch (error) {
    console.error('Error calculating AI search visibility:', error);
    return NextResponse.json(
      { error: 'Failed to calculate AI search visibility score' },
      { status: 500 }
    );
  }
}
