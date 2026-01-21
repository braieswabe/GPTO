import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { exportAuditLog } from '@gpto/governance';

/**
 * GET /api/export
 * 
 * Export data in various formats (CSV, JSON, PDF)
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
    const type = searchParams.get('type'); // 'audit', 'telemetry', 'sites'
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    if (type === 'audit') {
      const data = await exportAuditLog(startDate, endDate, format);
      
      if (format === 'csv') {
        return new NextResponse(data, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit-log-${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json(JSON.parse(data));
    }

    // Other export types would be implemented here
    return NextResponse.json(
      { error: `Export type "${type}" not implemented` },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
