import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, requireAuth } from '@/lib/dashboard-helpers';
import PDFDocument from 'pdfkit';

async function generatePDF(payload: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Dashboard Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date(payload.generatedAt as string).toLocaleString()}`, { align: 'center' });
    doc.text(`Range: ${payload.range}`, { align: 'center' });
    doc.moveDown(2);

    // Telemetry Section
    if (payload.telemetry) {
      const telemetry = payload.telemetry as Record<string, unknown>;
      doc.fontSize(16).text('Telemetry', { underline: true });
      doc.moveDown();
      if (telemetry.totals) {
        const totals = telemetry.totals as Record<string, number>;
        doc.fontSize(12).text(`Visits: ${totals.visits || 0}`);
        doc.text(`Page Views: ${totals.pageViews || 0}`);
        doc.text(`Searches: ${totals.searches || 0}`);
        doc.text(`Interactions: ${totals.interactions || 0}`);
      }
      doc.moveDown();
    }

    // Authority Section
    if (payload.authority) {
      const authority = payload.authority as Record<string, unknown>;
      doc.fontSize(16).text('Authority & Trust', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Authority Score: ${authority.authorityScore || 0}`);
      if (Array.isArray(authority.trustSignals)) {
        doc.text('Trust Signals:');
        (authority.trustSignals as Array<{ label: string; value: number }>).forEach((signal) => {
          doc.text(`  - ${signal.label}: ${signal.value}%`, { indent: 20 });
        });
      }
      doc.moveDown();
    }

    // Confusion Section
    if (payload.confusion) {
      const confusion = payload.confusion as Record<string, unknown>;
      doc.fontSize(16).text('Confusion & Mismatch', { underline: true });
      doc.moveDown();
      if (confusion.totals) {
        const totals = confusion.totals as Record<string, number>;
        doc.fontSize(12).text(`Repeated Searches: ${totals.repeatedSearches || 0}`);
        doc.text(`Dead Ends: ${totals.deadEnds || 0}`);
        doc.text(`Drop-offs: ${totals.dropOffs || 0}`);
        doc.text(`Intent Mismatches: ${totals.intentMismatches || 0}`);
      }
      doc.moveDown();
    }

    // Schema Section
    if (payload.schema) {
      const schema = payload.schema as Record<string, unknown>;
      doc.fontSize(16).text('Schema & Structure', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Completeness Score: ${schema.completenessScore || 0}%`);
      doc.text(`Quality Score: ${schema.qualityScore || 0}%`);
      doc.moveDown();
    }

    // Coverage Section
    if (payload.coverage) {
      const coverage = payload.coverage as Record<string, unknown>;
      doc.fontSize(16).text('Coverage & Gaps', { underline: true });
      doc.moveDown();
      if (coverage.totals) {
        const totals = coverage.totals as Record<string, number>;
        doc.fontSize(12).text(`Content Gaps: ${totals.contentGaps || 0}`);
        doc.text(`Missing Funnel Stages: ${totals.missingFunnelStages || 0}`);
        doc.text(`Missing Intents: ${totals.missingIntents || 0}`);
      }
      doc.moveDown();
    }

    // Executive Summary
    if (payload.executive) {
      const executive = payload.executive as Record<string, unknown>;
      doc.fontSize(16).text('Executive Summary', { underline: true });
      doc.moveDown();
      if (Array.isArray(executive.insights)) {
        (executive.insights as Array<{ question: string; answer: string | null }>).forEach((insight) => {
          doc.fontSize(12).text(insight.question, { bold: true });
          doc.text(insight.answer || 'No data available', { indent: 20 });
          doc.moveDown();
        });
      }
    }

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const searchParams = new URL(request.url).searchParams;
    const format = searchParams.get('format') || 'json';
    const siteId = searchParams.get('siteId');
    const { rangeKey, start, end } = parseDateRange(searchParams);

    const origin = new URL(request.url).origin;
    const authHeader = request.headers.get('authorization') || '';
    const headers = { Authorization: authHeader };

    const rangeParamBase = rangeKey === 'custom'
      ? `range=custom&start=${start.toISOString()}&end=${end.toISOString()}`
      : `range=${rangeKey}`;
    const rangeParam = siteId ? `${rangeParamBase}&siteId=${siteId}` : rangeParamBase;

    const [telemetry, confusion, authority, schema, coverage, index, executive] = await Promise.all([
      fetch(`${origin}/api/dashboard/telemetry?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/confusion?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/authority?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/schema?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/coverage?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/index?${rangeParam}`, { headers }).then((r) => r.json()),
      fetch(`${origin}/api/dashboard/executive-summary?${rangeParam}`, { headers }).then((r) => r.json()),
    ]);

    const payload = {
      generatedAt: new Date().toISOString(),
      range: rangeKey,
      telemetry,
      confusion,
      authority,
      schema,
      coverage,
      index,
      executive,
    };

    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(payload);
      const fileName = `dashboard-report-${dateStr}.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default JSON format
    const fileName = `dashboard-report-${dateStr}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error exporting dashboard report:', error);
    return NextResponse.json({ error: 'Failed to export dashboard report' }, { status: 500 });
  }
}
