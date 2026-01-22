import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { db } from '@gpto/database';
import { pantheraCanonPlans } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { generateOptimizationPlan } from '@gpto/panthera-canon';
import { getSiteTier } from '@gpto/tiers';
import { runTechnicalAudit } from '@gpto/audit';
import { reviewContent } from '@gpto/audit';
import { generateStructuredRecommendations } from '@gpto/audit';

/**
 * POST /api/panthera-canon/generate
 * 
 * Generate Panthera Canon optimization plan
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
    const { siteId, optimizationType } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required field: siteId' },
        { status: 400 }
      );
    }

    // Get tier
    const tier = await getSiteTier(siteId);
    if (!tier) {
      return NextResponse.json(
        { error: 'No active subscription found for this site' },
        { status: 403 }
      );
    }

    // Check if tier supports Panthera Canon (Silver+)
    if (tier === 'bronze') {
      return NextResponse.json(
        { error: 'Panthera Canon is only available for Silver and Gold tiers' },
        { status: 403 }
      );
    }

    // Run audits to gather data
    const [technicalAudit, contentAudit] = await Promise.all([
      runTechnicalAudit(siteId).catch(() => undefined),
      reviewContent(siteId).catch(() => undefined),
    ]);

    // Generate recommendations
    const recommendations = technicalAudit
      ? await generateStructuredRecommendations(technicalAudit, contentAudit)
      : undefined;

    // Generate optimization plan
    const plan = await generateOptimizationPlan({
      siteId,
      tier,
      optimizationType: optimizationType || 'comprehensive',
      technicalAudit,
      contentAudit,
      recommendations,
    });

    // Store plan
    const [storedPlan] = await db
      .insert(pantheraCanonPlans)
      .values({
        siteId,
        tier,
        planData: plan as unknown as Record<string, unknown>,
        optimizationType: optimizationType || 'comprehensive',
        status: 'draft',
      })
      .returning();

    return NextResponse.json({
      success: true,
      plan: storedPlan,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating Panthera Canon plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization plan' },
      { status: 500 }
    );
  }
}
