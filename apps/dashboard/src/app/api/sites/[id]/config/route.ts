import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@gpto/api/src/errors';

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

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/config/route.ts:18',message:'Config fetch request received',data:{siteId,userAgent:request.headers.get('user-agent')?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/config/route.ts:36',message:'Active config fetched',data:{hasActiveConfig:!!activeConfig,version:activeConfig?.version,isActive:activeConfig?.isActive,configKeys:activeConfig?.configJson?Object.keys(activeConfig.configJson):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!activeConfig) {
      return NextResponse.json(
        { error: 'No active configuration found' },
        { status: 404 }
      );
    }

    // Return config JSON (this is what Black Box reads)
    const configJson = activeConfig.configJson;
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/config/route.ts:49',message:'Returning config JSON',data:{version:activeConfig.version,hasTelemetry:!!configJson?.panthera_blackbox?.telemetry,telemetryEmit:configJson?.panthera_blackbox?.telemetry?.emit,brand:configJson?.panthera_blackbox?.site?.brand},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(configJson, {
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
