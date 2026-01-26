import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions, telemetryEvents } from '@gpto/database/src/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractToken, verifyToken, migrateConfig } from '@gpto/api';
import { AuthenticationError, NotFoundError } from '@gpto/api/src/errors';

/**
 * GET /api/sites/[id]
 * 
 * Get site details including current config and recent telemetry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id: siteId } = await params;
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:13',message:'Site detail request started',data:{siteId,hasAuthHeader:!!request.headers.get('authorization')},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:21',message:'Token extracted',data:{hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:24',message:'No token found',data:{authHeader},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new AuthenticationError();
    }

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:26',message:'Verifying token',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    verifyToken(token);

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:30',message:'Querying database for site',data:{siteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:33',message:'Site query result',data:{found:!!site,siteId:site?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (!site) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:36',message:'Site not found',data:{siteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:77',message:'Telemetry fetched',data:{count:recentTelemetry.length,firstEvent:recentTelemetry[0]?{id:recentTelemetry[0].id,metrics:recentTelemetry[0].metrics,metricsKeys:recentTelemetry[0].metrics?Object.keys(recentTelemetry[0].metrics):[]}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:40',message:'Querying active config',data:{hasActiveConfig:!!activeConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    // Migrate config if it's in old format
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:54',message:'Before migrateConfig',data:{hasConfigJson:!!activeConfig?.configJson},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const config = activeConfig?.configJson 
      ? migrateConfig(activeConfig.configJson)
      : null;

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:58',message:'Successfully prepared response',data:{hasConfig:!!config,telemetryCount:recentTelemetry.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      site,
      config,
      telemetry: recentTelemetry,
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/sites/[id]/route.ts:67',message:'Error caught',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error?error.message:String(error),isAuthError:error instanceof AuthenticationError,isNotFoundError:error instanceof NotFoundError},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    
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
