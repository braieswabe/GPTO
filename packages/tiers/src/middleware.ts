import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { checkFeatureAccess, checkCompetitorLimit, checkSchemaAccess } from './feature-gate';
import type { SchemaType } from './tier-config';

/**
 * Middleware to check tier-based feature access
 */
export async function requireFeature(
  request: NextRequest,
  feature: keyof ReturnType<typeof import('./tier-config').getTierFeatures>
): Promise<{ siteId: string; tier: string } | NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    // Get siteId from request (query param or body)
    const { searchParams } = new URL(request.url);
    let siteId = searchParams.get('siteId');

    if (!siteId) {
      const body = await request.json().catch(() => ({}));
      siteId = body.siteId;
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Check feature access
    const result = await checkFeatureAccess(siteId, feature);

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason || 'Feature not available' },
        { status: 403 }
      );
    }

    return {
      siteId,
      tier: result.tier!,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error in requireFeature middleware:', error);
    return NextResponse.json(
      { error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check competitor limit
 */
export async function requireCompetitorSlot(
  request: NextRequest,
  currentCount: number
): Promise<{ siteId: string } | NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    // Get siteId from request
    const { searchParams } = new URL(request.url);
    let siteId = searchParams.get('siteId');

    if (!siteId) {
      const body = await request.json().catch(() => ({}));
      siteId = body.siteId;
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Check competitor limit
    const result = await checkCompetitorLimit(siteId, currentCount);

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason || 'Competitor limit reached' },
        { status: 403 }
      );
    }

    return { siteId };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error in requireCompetitorSlot middleware:', error);
    return NextResponse.json(
      { error: 'Failed to check competitor limit' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check schema access
 */
export async function requireSchemaAccess(
  request: NextRequest,
  schemaType: SchemaType
): Promise<{ siteId: string } | NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    // Get siteId from request
    const { searchParams } = new URL(request.url);
    let siteId = searchParams.get('siteId');

    if (!siteId) {
      const body = await request.json().catch(() => ({}));
      siteId = body.siteId;
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Check schema access
    const result = await checkSchemaAccess(siteId, schemaType);

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason || 'Schema type not available' },
        { status: 403 }
      );
    }

    return { siteId };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error in requireSchemaAccess middleware:', error);
    return NextResponse.json(
      { error: 'Failed to check schema access' },
      { status: 500 }
    );
  }
}
