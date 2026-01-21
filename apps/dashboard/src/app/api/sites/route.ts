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
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

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

    // Create initial config version
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
          enabled: true,
          endpoint: `/api/telemetry/events`,
        },
        policy: {
          require_approval: true,
          allow_rollback: true,
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
