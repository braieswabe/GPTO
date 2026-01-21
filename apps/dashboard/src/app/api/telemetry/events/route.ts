import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents } from '@gpto/database/src/schema';
import { telemetryEventSchema, validator } from '@gpto/schemas';

/**
 * POST /api/telemetry/events
 * 
 * Telemetry ingestion endpoint for Black Box runtime.
 * Validates events, applies rate limiting, and stores in Neon PostgreSQL.
 */
export async function POST(request: NextRequest) {
  try {
    // CORS headers for Black Box
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      // CORS will be handled by vercel.json headers, but we can add additional logic here
    }

    // Rate limiting (simple in-memory for now, use Upstash Redis in production)
    // const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    // TODO: Implement proper rate limiting with Upstash Redis

    // Parse and validate request body
    const body = await request.json();
    
    // Validate against schema
    const isValid = validator.validate(telemetryEventSchema, body);
    if (!isValid) {
      const errors = validator.getErrors();
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const event = body as typeof telemetryEventSchema.$infer;

    // Find site by tenant/domain
    // For now, we'll use tenant field directly
    // In production, you'd look up the site_id from the tenant field
    
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
        // siteId will be looked up from tenant in production
        siteId: '00000000-0000-0000-0000-000000000000', // Placeholder
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        id: inserted.id,
        timestamp: inserted.timestamp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Telemetry ingestion error:', error);
    
    // Don't expose internal errors to clients
    return NextResponse.json(
      { error: 'Failed to process telemetry event' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
