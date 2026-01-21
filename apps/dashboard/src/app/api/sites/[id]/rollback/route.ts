import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, NotFoundError } from '@gpto/api/src/errors';
import { rollbackToVersion } from '@gpto/api/src/updates/rollback';

/**
 * POST /api/sites/[id]/rollback
 * 
 * Rollback to a previous version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const siteId = params.id;

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      throw new NotFoundError('Site');
    }

    // Parse request body
    const body = await request.json();
    const { targetVersion } = body;

    if (!targetVersion) {
      return NextResponse.json(
        { error: 'targetVersion is required' },
        { status: 400 }
      );
    }

    // Perform rollback
    await rollbackToVersion(siteId, targetVersion, payload.userId);

    return NextResponse.json({
      success: true,
      message: `Rolled back to version ${targetVersion}`,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error rolling back:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rollback' },
      { status: 500 }
    );
  }
}
