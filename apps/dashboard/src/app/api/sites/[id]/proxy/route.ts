import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@gpto/api/src/errors';
import { injectSchemasIntoHTML } from '@gpto/servos/gpto/src/server-schema-generator';

/**
 * GET /api/sites/[id]/proxy?url=<target-url>
 * 
 * Proxies a website URL and injects schemas server-side
 * This makes schemas visible to external audit tools
 * 
 * Usage: /api/sites/[id]/proxy?url=https://your-domain.com
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url') || `https://${(await db.select().from(sites).where(eq(sites.id, siteId)).limit(1))[0]?.domain}`;

    // Get site
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      throw new NotFoundError('Site');
    }

    // Get active config
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

    const config = activeConfig.configJson as { panthera_blackbox: any };

    // Fetch target URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTOProxy/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch ${targetUrl}: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Inject schemas into HTML
    const htmlWithSchemas = injectSchemasIntoHTML(html, config.panthera_blackbox);

    return new NextResponse(htmlWithSchemas, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error proxying with schema injection:', error);
    return NextResponse.json(
      { error: 'Failed to proxy and inject schemas' },
      { status: 500 }
    );
  }
}
