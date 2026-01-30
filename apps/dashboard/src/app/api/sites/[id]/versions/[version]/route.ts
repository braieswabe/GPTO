import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, NotFoundError } from '@gpto/api/src/errors';

/**
 * GET /api/sites/[id]/versions/[version]
 * 
 * Get a specific config version by version number
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id: siteId, version } = await params;
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      throw new NotFoundError('Site');
    }

    // Get config version
    const [configVersion] = await db
      .select()
      .from(configVersions)
      .where(and(
        eq(configVersions.siteId, siteId),
        eq(configVersions.version, version)
      ))
      .limit(1);

    if (!configVersion) {
      throw new NotFoundError(`Version ${version}`);
    }

    return NextResponse.json({
      version: configVersion.version,
      configJson: configVersion.configJson,
      isActive: configVersion.isActive,
      createdAt: configVersion.createdAt,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching config version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config version' },
      { status: 500 }
    );
  }
}
