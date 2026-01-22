import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { db } from '@gpto/database';
import { audits } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { generateScorecard, formatScorecardHTML } from '@gpto/reports';

/**
 * GET /api/reports/scorecard
 * 
 * Generate scorecard for an audit
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
    const auditId = searchParams.get('auditId');

    if (!auditId) {
      return NextResponse.json(
        { error: 'Missing required parameter: auditId' },
        { status: 400 }
      );
    }

    // Get audit
    const [audit] = await db
      .select()
      .from(audits)
      .where(eq(audits.id, auditId))
      .limit(1);

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Generate scorecard
    const scorecard = generateScorecard(
      audit.siteId,
      audit.tier,
      audit.results as any,
      undefined,
      audit.recommendations as any
    );

    // Return HTML format
    const format = searchParams.get('format') || 'json';
    
    if (format === 'html') {
      const html = formatScorecardHTML(scorecard);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    return NextResponse.json({
      success: true,
      scorecard,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to generate scorecard' },
      { status: 500 }
    );
  }
}
