import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, NotFoundError } from '@gpto/api/src/errors';

/**
 * GET /api/sites/[id]/config
 * 
 * Get current active config for a site (used by Black Box)
 * This endpoint is public (no auth) for Black Box to read config
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const siteId = params.id;

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      throw new NotFoundError('Site');
    }

    // Get active config version
    const [activeConfig] = await db
      .select()
      .from(configVersions)
      .where(and(
        eq(configVersions.siteId, siteId),
        eq(configVersions.isActive, true)
      ))
      .limit(1);

    if (!activeConfig) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    // Return config JSON (this is what Black Box reads)
    return NextResponse.json(activeConfig.configJson, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}
