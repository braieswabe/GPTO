import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { processApproval } from '@gpto/governance';

/**
 * POST /api/governance/approve
 * 
 * Approve an update
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
    const { approvalId, status } = body;

    if (!approvalId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: approvalId, status' },
        { status: 400 }
      );
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    await processApproval(approvalId, payload.userId, status, body.reason);

    return NextResponse.json({
      success: true,
      message: `Update ${status}`,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
