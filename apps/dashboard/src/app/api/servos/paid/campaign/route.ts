import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { createPPCCampaign } from '@gpto/servos-paid';

/**
 * POST /api/servos/paid/campaign
 * 
 * Create PPC campaign
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { provider, siteId, budget, targetAudience, creative, apiKey } = body;

    if (!provider || !siteId || !budget || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, siteId, budget, apiKey' },
        { status: 400 }
      );
    }

    const result = await createPPCCampaign(
      {
        provider,
        siteId,
        budget,
        targetAudience: targetAudience || {},
        creative,
      },
      apiKey
    );

    return NextResponse.json({
      success: true,
      campaign: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
