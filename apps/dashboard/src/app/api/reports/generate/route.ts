import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken, AuthenticationError } from '@gpto/api';
import { db } from '@gpto/database';
import { audits, reports } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { generatePDFReport } from '@gpto/reports';
import { generateScorecard } from '@gpto/reports';
import { sendEmailReport } from '@gpto/reports';
import { getSiteTier } from '@gpto/tiers';
import { sites } from '@gpto/database/src/schema';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate
 * 
 * Generate reports (PDF, email, scorecard) for an audit
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
    const { auditId, types } = body; // types: ['pdf', 'email', 'scorecard']

    if (!auditId) {
      return NextResponse.json(
        { error: 'Missing required field: auditId' },
        { status: 400 }
      );
    }

    const reportTypes = types || ['pdf', 'email', 'scorecard'];

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

    // Get site
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, audit.siteId))
      .limit(1);

    // Get tier
    const tier = await getSiteTier(audit.siteId);
    if (!tier) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    const results: Record<string, unknown> = {};

    // Generate scorecard
    if (reportTypes.includes('scorecard')) {
      const technicalAudit = audit.results as unknown as { schema?: unknown; performance?: unknown; seo?: unknown; accessibility?: unknown; security?: unknown };
      const scorecard = generateScorecard(
        audit.siteId,
        audit.tier,
        technicalAudit as any,
        undefined,
        audit.recommendations as any
      );
      results.scorecard = scorecard;
    }

    // Generate PDF
    if (reportTypes.includes('pdf')) {
      const pdfBuffer = await generatePDFReport({
        siteId: audit.siteId,
        tier: audit.tier as 'bronze' | 'silver' | 'gold',
        siteDomain: site?.domain,
        technicalAudit: audit.results as any,
        recommendations: audit.recommendations as any,
      });

      // In production, would upload to S3/cloud storage
      // For now, return base64 encoded
      const pdfBase64 = pdfBuffer.toString('base64');
      results.pdf = {
        data: pdfBase64,
        mimeType: 'application/pdf',
      };
    }

    // Send email (if email provided)
    if (reportTypes.includes('email')) {
      const { email } = body;
      if (email) {
        const scorecard = generateScorecard(
          audit.siteId,
          audit.tier,
          audit.results as any,
          undefined,
          audit.recommendations as any
        );
        
        await sendEmailReport({
          to: email,
          siteId: audit.siteId,
          siteDomain: site?.domain,
          scorecard,
        });

        results.email = { sent: true };
      }
    }

    // Store report record
    await db.insert(reports).values({
      siteId: audit.siteId,
      auditId,
      type: reportTypes.join(','),
      format: results as unknown as Record<string, unknown>,
      deliveredAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
