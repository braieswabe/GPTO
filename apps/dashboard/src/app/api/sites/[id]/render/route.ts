import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@gpto/api/src/errors';
import { generateSchemaScriptTags } from '@gpto/servos-gpto';

/**
 * GET /api/sites/[id]/render
 * 
 * Returns HTML with schemas pre-rendered for server-side injection
 * This makes schemas visible to external audit tools
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

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

    // Generate schema script tags
    const schemaScripts = generateSchemaScriptTags(config.panthera_blackbox);

    // Return as HTML snippet that can be injected
    return new NextResponse(schemaScripts, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating schema render:', error);
    return NextResponse.json(
      { error: 'Failed to generate schema render' },
      { status: 500 }
    );
  }
}
