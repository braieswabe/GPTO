import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';

/**
 * GET /api/sites
 * 
 * List all sites (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

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
