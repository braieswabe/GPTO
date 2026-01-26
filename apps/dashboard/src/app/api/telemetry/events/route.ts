import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, sites } from '@gpto/database/src/schema';
import { telemetryEventSchema, validator } from '@gpto/schemas';
import { eq } from 'drizzle-orm';

/**
 * POST /api/telemetry/events
 * 
 * Telemetry ingestion endpoint for Black Box runtime.
 * Validates events, applies rate limiting, and stores in Neon PostgreSQL.
 */
export async function POST(request: NextRequest) {
  // CORS headers for Black Box - declare once at function level
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  // Build CORS headers - use specific origin when provided, not wildcard
  const getCorsHeaders = () => {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Use specific origin if provided, otherwise allow all
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      // Only set credentials header if origin is specified (not wildcard)
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
    
    return headers;
  };
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:12',message:'Telemetry POST request received',data:{origin,contentType:request.headers.get('content-type'),method:request.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      // CORS will be handled by vercel.json headers, but we can add additional logic here
    }

    // Rate limiting (simple in-memory for now, use Upstash Redis in production)
    // const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    // TODO: Implement proper rate limiting with Upstash Redis

    // Parse and validate request body
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:27',message:'Before parsing request body',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const body = await request.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:30',message:'Request body parsed',data:{hasBody:!!body,bodyKeys:body?Object.keys(body):[],hasSchema:!!body?.schema,hasTenant:!!body?.tenant,hasMetrics:!!body?.metrics},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Validate against schema
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:30',message:'Before validation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const isValid = validator.validate(telemetryEventSchema, body);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:32',message:'Validation result',data:{isValid,errors:validator.getErrors()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!isValid) {
      const errors = validator.getErrors();
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:35',message:'Validation failed',data:{errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    const event = body as typeof telemetryEventSchema.$infer;

    // Find site by tenant/domain
    // The tenant field should match the site's domain
    // Normalize domain: remove protocol, www, trailing slashes
    const normalizeDomain = (domain: string) => {
      return domain
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/^www\./, '') // Remove www
        .replace(/\/$/, '') // Remove trailing slash
        .toLowerCase();
    };
    
    const normalizedTenant = normalizeDomain(event.tenant);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:48',message:'Looking up site by tenant',data:{tenant:event.tenant,normalizedTenant},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Try exact match first, then normalized match
    let [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.domain, event.tenant))
      .limit(1);
    
    // If not found, try normalized match
    if (!site) {
      const allSites = await db.select().from(sites);
      site = allSites.find(s => normalizeDomain(s.domain) === normalizedTenant) || undefined;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:53',message:'Site lookup result',data:{found:!!site,siteId:site?.id,domain:site?.domain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // If site not found, we can't store telemetry due to foreign key constraint
    // Return success but don't store (telemetry is non-critical)
    if (!site) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:89',message:'Site not found for tenant',data:{tenant:event.tenant},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      // Return success but don't store - telemetry is non-critical
      // This prevents foreign key constraint violations
      return NextResponse.json(
        {
          success: true,
          message: 'Telemetry received but site not found',
        },
        { 
          status: 200,
          headers: getCorsHeaders(),
        }
      );
    }
    
    const siteId = site.id;
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:60',message:'Before database insert',data:{tenant:event.tenant,source:event.source,hasMetrics:!!event.metrics,siteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // Store telemetry event (append-only)
    const [inserted] = await db
      .insert(telemetryEvents)
      .values({
        tenant: event.tenant,
        timestamp: new Date(event.timestamp),
        source: event.source,
        context: event.context || null,
        metrics: event.metrics,
        edges: event.edges || null,
        siteId: siteId,
      })
      .returning();
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:66',message:'Database insert successful',data:{insertedId:inserted?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(
      {
        success: true,
        id: inserted.id,
        timestamp: inserted.timestamp,
      },
      { 
        status: 201,
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/telemetry/events/route.ts:82',message:'Error caught',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    console.error('Telemetry ingestion error:', error);
    
    // Don't expose internal errors to clients
    return NextResponse.json(
      { error: 'Failed to process telemetry event' },
      { 
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  // Use specific origin if provided, otherwise allow all
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
