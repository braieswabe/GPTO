import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions, updateHistory, approvals } from '@gpto/database/src/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractToken, verifyToken, migrateConfig } from '@gpto/api';
import { AuthenticationError, NotFoundError, ValidationError } from '@gpto/api/src/errors';
import { signUpdate } from '@gpto/api/src/updates/signature';
import { incrementVersion } from '@gpto/api/src/updates/versioning';
import { calculateDiff } from '@gpto/api/src/updates/diff';
import { validator } from '@gpto/schemas';
import { siteConfigSchema } from '@gpto/schemas/src/site-config';
import { createApproval } from '@gpto/governance';

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
    let { newConfig, changeType = 'patch' } = body;

    // Migrate config if it's in old format (for backward compatibility)
    newConfig = migrateConfig(newConfig);

    // Validate new config
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/updates/route.ts:59',message:'Starting config validation',data:{siteId,hasNewConfig:!!newConfig,newConfigKeys:newConfig?Object.keys(newConfig):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const isValid = validator.validate(siteConfigSchema, newConfig);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/updates/route.ts:62',message:'Validation result',data:{isValid,errorsCount:validator.getErrors().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!isValid) {
      const errors = validator.getErrors();
      
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/updates/route.ts:66',message:'Validation failed - errors captured',data:{errors,errorsLength:errors.length,errorsString:JSON.stringify(errors)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.error('Config validation failed:', errors);
      console.error('Config received:', JSON.stringify(newConfig, null, 2));
      
      // Also log the raw AJV errors for debugging
      const rawErrors = (validator as any).lastErrors || (validator as any).ajv?.errors;
      console.error('Raw AJV errors:', JSON.stringify(rawErrors, null, 2));
      
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

    // Create approval request
    const approvalId = await createApproval(update.id);

    return NextResponse.json({
      success: true,
      update: {
        id: update.id,
        fromVersion,
        toVersion,
        changes,
        signature,
        status: 'pending',
        approvalId,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json({ 
        error: error.message,
        details: error.errors 
      }, { status: error.statusCode });
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

    // Get update history with approval status
    const updates = await db
      .select({
        id: updateHistory.id,
        siteId: updateHistory.siteId,
        fromVersion: updateHistory.fromVersion,
        toVersion: updateHistory.toVersion,
        diff: updateHistory.diff,
        signature: updateHistory.signature,
        appliedAt: updateHistory.appliedAt,
        rolledBackAt: updateHistory.rolledBackAt,
        userId: updateHistory.userId,
        createdAt: updateHistory.createdAt,
      })
      .from(updateHistory)
      .where(eq(updateHistory.siteId, siteId))
      .orderBy(desc(updateHistory.createdAt))
      .limit(50);

    // Get approval status for each update
    const updatesWithApprovals = await Promise.all(
      updates.map(async (update) => {
        const [approval] = await db
          .select()
          .from(approvals)
          .where(eq(approvals.updateId, update.id))
          .limit(1);

        return {
          ...update,
          approval: approval ? {
            id: approval.id,
            status: approval.status,
            approvedBy: approval.approvedBy,
            approvedAt: approval.approvedAt,
            rejectedReason: approval.rejectedReason,
          } : null,
        };
      })
    );

    return NextResponse.json({
      data: updatesWithApprovals,
      total: updatesWithApprovals.length,
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
