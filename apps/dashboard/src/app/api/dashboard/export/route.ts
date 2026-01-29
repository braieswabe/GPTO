import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, requireAuth } from '@/lib/dashboard-helpers';
import PDFDocument from 'pdfkit';

type ExportPayload = {
  generatedAt: string;
  range: string;
  rangeLabel: string;
  site?: {
    id?: string;
    domain?: string;
    brand?: string;
  };
  telemetry?: Record<string, unknown>;
  confusion?: Record<string, unknown>;
  authority?: Record<string, unknown>;
  schema?: Record<string, unknown>;
  coverage?: Record<string, unknown>;
  index?: Record<string, unknown>;
  executive?: Record<string, unknown>;
};

async function generatePDF(payload: ExportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const brandName = payload.site?.brand || 'GPTO Suite';
    const domain = payload.site?.domain;
    const primary = '#0F62FE';
    const accent = '#111827';
    const muted = '#6B7280';

    // Branded header
    const headerY = doc.y;
    doc.save();
    doc.rect(0, 0, doc.page.width, 90).fill(primary);
    doc.fillColor('white').fontSize(22).text('GPTO Suite', 50, 22, { align: 'left' });
    doc.fontSize(14).text('Dashboard Export', 50, 50, { align: 'left' });
    doc.restore();

    doc.y = headerY + 100;
    doc.moveDown(0.5);
    doc.fillColor(accent).fontSize(18).text(brandName, { align: 'left' });
    if (domain) {
      doc.fillColor(muted).fontSize(11).text(domain, { align: 'left' });
    }
    doc.moveDown(0.5);
    doc.fillColor(muted).fontSize(10).text(`Generated: ${new Date(payload.generatedAt).toLocaleString()}`);
    doc.text(`Range: ${payload.rangeLabel}`);
    doc.moveDown(1.5);

    // Telemetry Section
    if (payload.telemetry) {
      const telemetry = payload.telemetry as Record<string, unknown>;
      doc.fillColor(accent).fontSize(15).text('Telemetry', { underline: false });
      doc.moveDown();
      if (telemetry.totals) {
        const totals = telemetry.totals as Record<string, number>;
        doc.fillColor(accent).fontSize(12).text(`Visits: ${totals.visits || 0}`);
        doc.text(`Page Views: ${totals.pageViews || 0}`);
        doc.text(`Searches: ${totals.searches || 0}`);
        doc.text(`Interactions: ${totals.interactions || 0}`);
      }
      doc.moveDown();
    }

    // Authority Section
    if (payload.authority) {
      const authority = payload.authority as Record<string, unknown>;
      doc.fillColor(accent).fontSize(15).text('Authority & Trust', { underline: false });
      doc.moveDown();
      doc.fillColor(accent).fontSize(12).text(`Authority Score: ${authority.authorityScore || 0}`);
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
      doc.fillColor(accent).fontSize(15).text('Confusion & Mismatch', { underline: false });
      doc.moveDown();
      if (confusion.totals) {
        const totals = confusion.totals as Record<string, number>;
        doc.fillColor(accent).fontSize(12).text(`Repeated Searches: ${totals.repeatedSearches || 0}`);
        doc.text(`Dead Ends: ${totals.deadEnds || 0}`);
        doc.text(`Drop-offs: ${totals.dropOffs || 0}`);
        doc.text(`Intent Mismatches: ${totals.intentMismatches || 0}`);
      }
      doc.moveDown();
    }

    // Schema Section
    if (payload.schema) {
      const schema = payload.schema as Record<string, unknown>;
      doc.fillColor(accent).fontSize(15).text('Schema & Structure', { underline: false });
      doc.moveDown();
      doc.fillColor(accent).fontSize(12).text(`Completeness Score: ${schema.completenessScore || 0}%`);
      doc.text(`Quality Score: ${schema.qualityScore || 0}%`);
      doc.moveDown();
    }

    // Coverage Section
    if (payload.coverage) {
      const coverage = payload.coverage as Record<string, unknown>;
      doc.fillColor(accent).fontSize(15).text('Coverage & Gaps', { underline: false });
      doc.moveDown();
      if (coverage.totals) {
        const totals = coverage.totals as Record<string, number>;
        doc.fillColor(accent).fontSize(12).text(`Content Gaps: ${totals.contentGaps || 0}`);
        doc.text(`Missing Funnel Stages: ${totals.missingFunnelStages || 0}`);
        doc.text(`Missing Intents: ${totals.missingIntents || 0}`);
      }
      doc.moveDown();
    }

    // Executive Summary
    if (payload.executive) {
      const executive = payload.executive as Record<string, unknown>;
      doc.fillColor(accent).fontSize(15).text('Executive Summary', { underline: false });
      doc.moveDown();
      if (Array.isArray(executive.insights)) {
        (executive.insights as Array<{ question: string; answer: string | null }>).forEach((insight) => {
          doc.fillColor(accent).fontSize(12).text(insight.question);
          doc.fillColor(muted).text(insight.answer || 'No data available', { indent: 20 });
          doc.moveDown();
        });
      }
    }

    // Footer
    doc.moveDown(1.5);
    doc.fillColor(muted).fontSize(9).text('GPTO Suite • Panthera Black Box', { align: 'center' });

    doc.end();
  });
}

async function fetchJSON(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });
  const data = await response.json().catch(() => null);
  const ok = response.ok ?? true;
  if (!ok) {
    return { error: true, status: response.status, data };
  }
  return data;
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

    const [telemetry, confusion, authority, schema, coverage, index, executive, siteDetail] = await Promise.all([
      fetchJSON(`${origin}/api/dashboard/telemetry?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/confusion?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/authority?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/schema?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/coverage?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/index?${rangeParam}`, headers),
      fetchJSON(`${origin}/api/dashboard/executive-summary?${rangeParam}`, headers),
      siteId ? fetchJSON(`${origin}/api/sites/${siteId}`, headers) : Promise.resolve(null),
    ]);

    const rangeLabel =
      rangeKey === 'custom'
        ? `${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}`
        : rangeKey;

    const payload: ExportPayload = {
      generatedAt: new Date().toISOString(),
      range: rangeKey,
      rangeLabel,
      telemetry,
      confusion,
      authority,
      schema,
      coverage,
      index,
      executive,
      site: siteDetail && typeof siteDetail === 'object'
        ? {
            id: siteId ?? undefined,
            domain: (siteDetail as Record<string, unknown>)?.site
              ? String((siteDetail as Record<string, unknown>)?.site?.domain || '')
              : undefined,
            brand: (siteDetail as Record<string, unknown>)?.config
              ? String((siteDetail as Record<string, unknown>)?.config?.panthera_blackbox?.site?.brand || '')
              : undefined,
          }
        : siteId
          ? { id: siteId }
          : undefined,
    };

    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(payload);
      const safeBrand = payload.site?.brand ? payload.site.brand.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'gpto';
      const fileName = `dashboard-report-${safeBrand}-${dateStr}.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default JSON format
    const safeBrand = payload.site?.brand ? payload.site.brand.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'gpto';
    const fileName = `dashboard-report-${safeBrand}-${dateStr}.json`;

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
