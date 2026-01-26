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
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
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
