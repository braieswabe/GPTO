import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions, telemetryEvents } from '@gpto/database/src/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, NotFoundError } from '@gpto/api/src/errors';

/**
 * GET /api/sites/[id]
 * 
 * Get site details including current config and recent telemetry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

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
      .where(and(eq(configVersions.siteId, siteId), eq(configVersions.isActive, true)))
      .limit(1);

    // Get recent telemetry (last 100 events)
    const recentTelemetry = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.siteId, siteId))
      .orderBy(desc(telemetryEvents.timestamp))
      .limit(100);

    return NextResponse.json({
      site,
      config: activeConfig?.configJson || null,
      telemetry: recentTelemetry,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}
