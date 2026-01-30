import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import {
  telemetryEvents,
  confusionSignals,
  coverageSignals,
  authoritySignals,
  audits,
} from '@gpto/database/src/schema';
import { and, gte, inArray, lte, desc } from 'drizzle-orm';
import { AuthenticationError } from '@gpto/api/src/errors';
import { parseDateRange, getSiteIds } from '@/lib/dashboard-helpers';

function coerceNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const siteId = searchParams.get('siteId');
    const { start, end, rangeKey } = parseDateRange(searchParams);

    const siteIds = await getSiteIds(request, siteId);
    if (siteIds.length === 0) {
      return NextResponse.json({
        range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
        insights: [],
      });
    }

    const telemetry = await db
      .select({
        eventType: telemetryEvents.eventType,
        page: telemetryEvents.page,
        metrics: telemetryEvents.metrics,
        context: telemetryEvents.context,
      })
      .from(telemetryEvents)
      .where(
        and(
          inArray(telemetryEvents.siteId, siteIds),
          gte(telemetryEvents.timestamp, start),
          lte(telemetryEvents.timestamp, end)
        )
      );

    const pageCounts = new Map<string, number>();
    let authoritySum = 0;
    let authorityCount = 0;

    telemetry.forEach((event) => {
      if (event.eventType === 'page_view') {
        const page = event.page as Record<string, unknown> | null;
        const url = page?.url as string | undefined;
        if (url) pageCounts.set(url, (pageCounts.get(url) || 0) + 1);
      }
      const metrics = event.metrics as Record<string, number>;
      const authority = metrics?.['ts.authority'];
      if (typeof authority === 'number') {
        authoritySum += authority;
        authorityCount += 1;
      }
    });

    const topPage = Array.from(pageCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const authorityAvg = authorityCount ? authoritySum / authorityCount : 0;
    let periodicConfusionTotal = 0;
    telemetry.forEach((event) => {
      const context = (event.context as Record<string, unknown> | null) || null;
      if (context?.periodic !== true) return;
      const confusion = (context.confusion as Record<string, unknown> | null) || null;
      if (!confusion) return;
      periodicConfusionTotal += coerceNumber(confusion.repeatedSearches) ?? 0;
      periodicConfusionTotal += coerceNumber(confusion.deadEnds) ?? 0;
      periodicConfusionTotal += coerceNumber(confusion.dropOffs) ?? 0;
    });

    const confusion = await db
      .select({ type: confusionSignals.type, score: confusionSignals.score })
      .from(confusionSignals)
      .where(
        and(
          inArray(confusionSignals.siteId, siteIds),
          gte(confusionSignals.windowStart, start),
          lte(confusionSignals.windowEnd, end)
        )
      );

    const coverage = await db
      .select({ gaps: coverageSignals.gaps, missingStages: coverageSignals.missingStages })
      .from(coverageSignals)
      .where(
        and(
          inArray(coverageSignals.siteId, siteIds),
          gte(coverageSignals.windowStart, start),
          lte(coverageSignals.windowEnd, end)
        )
      )
      .orderBy(desc(coverageSignals.createdAt));

    const authority = await db
      .select({ authorityScore: authoritySignals.authorityScore })
      .from(authoritySignals)
      .where(
        and(
          inArray(authoritySignals.siteId, siteIds),
          gte(authoritySignals.windowStart, start),
          lte(authoritySignals.windowEnd, end)
        )
      )
      .orderBy(desc(authoritySignals.createdAt));

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/dashboard/executive-summary/route.ts:119',message:'Before audits query',data:{siteIdsCount:siteIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let latestAudits: Array<{ siteId: string; results: unknown; createdAt: Date }> = [];
    try {
      latestAudits = await db
        .select({
          siteId: audits.siteId,
          results: audits.results,
          createdAt: audits.createdAt,
        })
        .from(audits)
        .where(inArray(audits.siteId, siteIds))
        .orderBy(desc(audits.createdAt));
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/dashboard/executive-summary/route.ts:127',message:'Audits query succeeded',data:{auditsCount:latestAudits.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (auditError: unknown) {
      // #region agent log
      const errorMessage = auditError instanceof Error ? auditError.message : String(auditError);
      const errorCause = (auditError as { cause?: { code?: string; message?: string } })?.cause;
      const errorCode = errorCause?.code || (auditError as { code?: string })?.code;
      const causeMessage = errorCause?.message || '';
      const isTableMissing = errorMessage.includes('does not exist') || 
                             errorMessage.includes('relation') ||
                             causeMessage.includes('does not exist') ||
                             causeMessage.includes('relation') ||
                             errorCode === '42P01';
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/dashboard/executive-summary/route.ts:136',message:'Audits query failed',data:{error:errorMessage,causeMessage,code:errorCode,isTableMissing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Handle gracefully if audits table doesn't exist (migration not run yet)
      // Error code 42P01 = "relation does not exist" in PostgreSQL
      if (isTableMissing) {
        console.warn('Audits table does not exist (migration may not have run), continuing without audit data');
      } else {
        console.error('Audits table query failed with unexpected error:', auditError);
      }
      // Continue with empty audits array - the rest of the code handles this gracefully
    }

    const auditBySite = new Map<string, Record<string, unknown>>();
    for (const audit of latestAudits) {
      if (!auditBySite.has(audit.siteId)) {
        auditBySite.set(audit.siteId, (audit.results as Record<string, unknown>) || {});
      }
    }

    const auditCoverageGaps: string[] = [];
    for (const audit of auditBySite.values()) {
      const siteAudit = (audit as { siteAudit?: Record<string, unknown> }).siteAudit;
      const signals = siteAudit?.signals as Record<string, unknown> | undefined;
      const answerability = signals?.answerability as Record<string, unknown> | undefined;
      if (!answerability) continue;
      const whatRate = answerability.whatRate as number | undefined;
      const whoRate = answerability.whoRate as number | undefined;
      const howRate = answerability.howRate as number | undefined;
      const trustRate = answerability.trustRate as number | undefined;
      if (typeof whatRate === 'number' && whatRate < 0.5) auditCoverageGaps.push('what coverage');
      if (typeof whoRate === 'number' && whoRate < 0.5) auditCoverageGaps.push('who coverage');
      if (typeof howRate === 'number' && howRate < 0.5) auditCoverageGaps.push('how coverage');
      if (typeof trustRate === 'number' && trustRate < 0.5) auditCoverageGaps.push('trust proof');
    }

    const hasTelemetry = telemetry.length > 0;
    const confusionTotal = confusion.reduce((sum, item) => sum + (item.score || 0), 0);
    const hasConfusion = confusionTotal > 0 || periodicConfusionTotal > 0;
    const hasCoverage = coverage.length > 0 || auditCoverageGaps.length > 0;
    const hasAuthority = authority.length > 0 || authorityAvg > 0;
    const coverageMissingStages =
      coverage.length > 0 && Array.isArray(coverage[0]?.missingStages)
        ? (coverage[0].missingStages as string[]).filter(Boolean)
        : [];
    const coverageStageSummary =
      coverageMissingStages.length > 0
        ? coverageMissingStages.join(', ')
        : auditCoverageGaps.length > 0
          ? Array.from(new Set(auditCoverageGaps)).join(', ')
          : 'key stages';

    const insights = [
      {
        question: "What's working?",
        answer: hasTelemetry && topPage
          ? `Traffic concentrates on ${topPage[0]} and authority holds steady at ${Math.round(authorityAvg * 100)}.`
          : null,
      },
      {
        question: "What's broken?",
        answer: hasConfusion
          ? `Confusion signals detected (${confusionTotal || periodicConfusionTotal} total).`
          : hasTelemetry
            ? 'No major confusion signals detected yet.'
            : null,
      },
      {
        question: 'What should we change?',
        answer: hasCoverage
          ? `Coverage gaps remain in ${coverageStageSummary}.`
          : hasTelemetry || auditBySite.size > 0
            ? 'Coverage signals are still warming up; sync content inventory to surface gaps.'
            : null,
      },
      {
        question: 'What should we stop?',
        answer: hasConfusion
          ? 'Stop investing in flows with repeated searches and dead ends until fixes land.'
          : hasTelemetry
            ? 'No stop signals yet; keep monitoring friction.'
            : null,
      },
      {
        question: 'What should we double down on or sell?',
        answer: hasAuthority
          ? `Double down on pages with authority lift (score ${authority[0]?.authorityScore ?? Math.round(authorityAvg * 100)}).`
          : hasTelemetry && topPage
            ? `Double down on ${topPage[0]} (highest traffic right now).`
            : null,
      },
    ];

    return NextResponse.json({
      range: { start: start.toISOString(), end: end.toISOString(), range: rangeKey },
      insights,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching executive summary:', error);
    return NextResponse.json({ error: 'Failed to fetch executive summary' }, { status: 500 });
  }
}
