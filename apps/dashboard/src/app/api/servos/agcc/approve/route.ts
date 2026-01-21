import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { db } from '@gpto/database';
import { configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/servos/agcc/approve
 * 
 * Approve AGCC content for deployment
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    const body = await request.json();
    const { siteId, config, version } = body;

    if (!siteId || !config || !version) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, config, version' },
        { status: 400 }
      );
    }

    // Deactivate current active version
    await db
      .update(configVersions)
      .set({ isActive: false })
      .where(and(
        eq(configVersions.siteId, siteId),
        eq(configVersions.isActive, true)
      ));

    // Activate new version
    await db
      .update(configVersions)
      .set({ isActive: true })
      .where(and(
        eq(configVersions.siteId, siteId),
        eq(configVersions.version, version)
      ));

    return NextResponse.json({
      success: true,
      message: 'Content approved and deployed',
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error approving content:', error);
    return NextResponse.json(
      { error: 'Failed to approve content' },
      { status: 500 }
    );
  }
}
