import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { db } from '@gpto/database';
import { competitors } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { requireCompetitorSlot } from '@gpto/tiers';

/**
 * POST /api/competitors/add
 * 
 * Add a competitor to track
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
    const { siteId, domain, name } = body;

    if (!siteId || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, domain' },
        { status: 400 }
      );
    }

    // Check competitor limit
    const currentCount = await db
      .select()
      .from(competitors)
      .where(eq(competitors.siteId, siteId))
      .then(results => results.length);

    const limitCheck = await requireCompetitorSlot(request, currentCount);
    if (limitCheck instanceof NextResponse) {
      return limitCheck;
    }

    // Add competitor
    const [competitor] = await db
      .insert(competitors)
      .values({
        siteId,
        domain: domain.replace(/^https?:\/\//, '').split('/')[0], // Normalize domain
        name: name || domain,
      })
      .returning();

    return NextResponse.json({
      success: true,
      competitor,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error adding competitor:', error);
    return NextResponse.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}
