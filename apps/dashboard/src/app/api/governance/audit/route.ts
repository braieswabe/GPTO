import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { getAuditLog, exportAuditLog } from '@gpto/governance';

/**
 * GET /api/governance/audit
 * 
 * Get audit log
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

    if (format === 'csv' && since) {
      const endDate = new Date();
      const csv = await exportAuditLog(since, endDate, 'csv');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${Date.now()}.csv"`,
        },
      });
    }

    const entries = await getAuditLog({
      userId,
      resourceType,
      resourceId,
      since,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: entries,
      total: entries.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
