import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions, updateHistory } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, NotFoundError, ValidationError } from '@gpto/api/src/errors';
import { signUpdate, verifySignature } from '@gpto/api/src/updates/signature';
import { incrementVersion, compareVersions } from '@gpto/api/src/updates/versioning';
import { calculateDiff } from '@gpto/api/src/updates/diff';
import { validator } from '@gpto/schemas';
import { siteConfigSchema } from '@gpto/schemas/src/site-config';

/**
 * POST /api/sites/[id]/updates
 * 
 * Create a signed, versioned update for a site
 */
export async function POST(
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

    const payload = verifyToken(token);
    const siteId = params.id;

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      throw new NotFoundError('Site');
    }

    // Get current active config
    const [currentConfig] = await db
      .select()
      .from(configVersions)
      .where(and(
        eq(configVersions.siteId, siteId),
        eq(configVersions.isActive, true)
      ))
      .limit(1);

    if (!currentConfig) {
      throw new NotFoundError('Active configuration');
    }

    // Parse request body
    const body = await request.json();
    const { newConfig, changeType = 'patch' } = body;

    // Validate new config
    const isValid = validator.validate(siteConfigSchema, newConfig);
    if (!isValid) {
      const errors = validator.getErrors();
      throw new ValidationError('Invalid configuration', errors);
    }

    // Calculate diff
    const changes = calculateDiff(currentConfig.configJson, newConfig);

    // Generate new version
    const fromVersion = currentConfig.version;
    const toVersion = incrementVersion(fromVersion, changeType);

    // Sign the update
    const signature = signUpdate({
      site_id: siteId,
      from_version: fromVersion,
      to_version: toVersion,
      changes,
    });

    // Create update record
    const [update] = await db
      .insert(updateHistory)
      .values({
        siteId,
        fromVersion,
        toVersion,
        diff: { changes },
        signature,
        signedBy: payload.userId,
        signedAt: new Date(),
        userId: payload.userId,
      })
      .returning();

    // Create new config version (not active yet - requires approval)
    await db.insert(configVersions).values({
      siteId,
      version: toVersion,
      configJson: newConfig,
      isActive: false, // Will be activated after approval
      createdBy: payload.userId,
    });

    return NextResponse.json({
      success: true,
      update: {
        id: update.id,
        fromVersion,
        toVersion,
        changes,
        signature,
        status: 'pending',
      },
    });
  } catch (error) {
    if (
      error instanceof AuthenticationError ||
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating update:', error);
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites/[id]/updates
 * 
 * List update history for a site
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

    // Get update history
    const updates = await db
      .select()
      .from(updateHistory)
      .where(eq(updateHistory.siteId, siteId))
      .orderBy(updateHistory.createdAt)
      .limit(50);

    return NextResponse.json({
      data: updates,
      total: updates.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
