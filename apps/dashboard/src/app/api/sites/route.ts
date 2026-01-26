import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, ValidationError } from '@gpto/api/src/errors';
import { randomUUID } from 'crypto';

/**
 * GET /api/sites
 * 
 * List all sites (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token); // Verify token is valid

    // Query sites
    const sitesList = await db.select().from(sites);

    return NextResponse.json({
      data: sitesList,
      total: sitesList.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites
 * 
 * Create a new site (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    // #region agent log
    const fs = await import('fs/promises');
    const logPath = '/Users/braiebook/GPTO/.cursor/debug.log';
    await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:50',message:'POST /api/sites called',data:{authHeaderExists:!!authHeader,authHeaderValue:authHeader?authHeader.substring(0,30)+'...':null,authHeaderLength:authHeader?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n').catch(()=>{});
    // #endregion
    
    const token = extractToken(authHeader ?? undefined);
    
    // #region agent log
    await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:56',message:'Token extracted',data:{tokenExists:!!token,tokenLength:token?.length||0,tokenValue:token?token.substring(0,20)+'...':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n').catch(()=>{});
    // #endregion
    
    if (!token) {
      // #region agent log
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:59',message:'No token found - throwing AuthenticationError',data:{authHeader:authHeader},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n').catch(()=>{});
      // #endregion
      throw new AuthenticationError();
    }

    // #region agent log
    let payload = null;
    try {
      payload = verifyToken(token);
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:65',message:'Token verified successfully',data:{userId:payload.userId,email:payload.email,role:payload.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})+'\n').catch(()=>{});
    } catch (err) {
      const verifyError = err instanceof Error ? err.message : String(err);
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:65',message:'Token verification failed',data:{error:verifyError,tokenLength:token.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})+'\n').catch(()=>{});
      throw err;
    }
    // #endregion

    const body = await request.json();
    const { domain, brand, verticals = [], geo = [] } = body;

    // Validation
    if (!domain || typeof domain !== 'string') {
      throw new ValidationError('Domain is required');
    }

    if (!brand || typeof brand !== 'string') {
      throw new ValidationError('Brand name is required');
    }

    // Create site
    const siteId = randomUUID();
    const [newSite] = await db
      .insert(sites)
      .values({
        id: siteId,
        domain: domain.trim(),
        status: 'pending',
        configUrl: `/api/sites/${siteId}/config`,
      })
      .returning();

    // Create initial config version (must match siteConfigSchema)
    const initialConfig = {
      panthera_blackbox: {
        version: '1.0.0',
        site: {
          domain: domain.trim(),
          brand: brand.trim(),
          verticals: Array.isArray(verticals) ? verticals : [],
          geo: Array.isArray(geo) ? geo : [],
        },
        telemetry: {
          emit: true,
          keys: ['ts.intent', 'ts.authority', 'ts.rank', 'ai.schemaCompleteness', 'ai.searchVisibility'],
        },
        policy: {
          privacy_mode: 'anon' as const,
          log_level: 'basic' as const,
        },
      },
    };

    await db.insert(configVersions).values({
      siteId: newSite.id,
      version: '1.0.0',
      configJson: initialConfig,
      isActive: true,
      createdBy: payload.userId,
    });

    return NextResponse.json({
      success: true,
      data: newSite,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
