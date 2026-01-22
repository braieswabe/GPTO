import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { db } from '@gpto/database';
import { audits } from '@gpto/database/src/schema';
import { reviewContent } from '@gpto/audit';
import { getSiteTier } from '@gpto/tiers';

/**
 * POST /api/audit/content
 * 
 * Run content audit for a site
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
    const { siteId, pages } = body;

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

    // Run content audit
    const auditResult = await reviewContent(siteId, pages);

    // Store audit
    const [audit] = await db
      .insert(audits)
      .values({
        siteId,
        tier,
        type: 'content',
        status: 'completed',
        results: auditResult as unknown as Record<string, unknown>,
        createdAt: new Date(),
        completedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      audit,
      results: auditResult,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error running content audit:', error);
    return NextResponse.json(
      { error: 'Failed to run content audit' },
      { status: 500 }
    );
  }
}
