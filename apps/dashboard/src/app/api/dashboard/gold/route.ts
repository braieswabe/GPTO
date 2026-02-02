import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import {
  sites,
  authoritySignals,
  confusionSignals,
  coverageSignals,
  contentInventory,
  updateHistory,
  dashboardRollupsDaily,
  subscriptions,
} from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { getSiteIds, parseDateRange } from '@/lib/dashboard-helpers';

/**
 * GET /api/dashboard/gold
 * 
 * Fetch Gold Dashboard data for a specific site
 * Returns diagnostic and optimization intelligence (no ROI/revenue/conversion metrics)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);

    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const userRole = payload.role;

    // Verify user has access to this site
    const accessibleSiteIds = await getSiteIds(request, siteId);
    
    if (!accessibleSiteIds.includes(siteId)) {
      throw new AuthenticationError('Access denied to this site');
    }

    // Get site info
    const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get subscription tier
    let tier = 'bronze';
    let subscription: { tier: string } | null = null;
    
    try {
      const subscriptionResult = await db
        .select({ tier: subscriptions.tier })
        .from(subscriptions)
        .where(eq(subscriptions.siteId, siteId))
        .limit(1);
      
      subscription = subscriptionResult[0] || null;
      tier = subscription?.tier || 'bronze';
    } catch (subscriptionError) {
      // Default to bronze if subscription query fails (table might not exist or no record)
      tier = 'bronze';
    }

    // For client users, allow access even if tier is not 'gold' (they should only see Gold Dashboard)
    // For other roles, enforce Gold tier requirement
    if (userRole !== 'client' && tier !== 'gold') {
      return NextResponse.json({ error: 'Gold dashboard is only available for Gold tier sites' }, { status: 403 });
    }
    
    // If client user but tier is not gold, we still allow access but note it in the response
    // (This handles cases where subscription table doesn't exist or site doesn't have a subscription record)

    // Date range - default to last 30 days
    const { start, end } = parseDateRange(searchParams);

    // 1. Executive Signal Bar
    let latestAuthority: Array<{ authorityScore: number; blockers: unknown; createdAt: Date }> = [];
    try {
      latestAuthority = await db
        .select()
        .from(authoritySignals)
        .where(
          and(
            eq(authoritySignals.siteId, siteId),
            lte(authoritySignals.windowStart, end),
            gte(authoritySignals.windowEnd, start)
          )
        )
        .orderBy(desc(authoritySignals.createdAt))
        .limit(1);
    } catch (authError) {
      // Continue with empty array if query fails
      latestAuthority = [];
    }

    let latestConfusion: Array<{ type: string; score: number }> = [];
    try {
      latestConfusion = await db
        .select()
        .from(confusionSignals)
        .where(
          and(
            eq(confusionSignals.siteId, siteId),
            lte(confusionSignals.windowStart, end),
            gte(confusionSignals.windowEnd, start)
          )
        )
        .orderBy(desc(confusionSignals.createdAt))
        .limit(4);
    } catch (confusionError) {
      latestConfusion = [];
    }

    let latestCoverage: Array<{ gaps: unknown; missingIntents: unknown }> = [];
    try {
      latestCoverage = await db
        .select()
        .from(coverageSignals)
        .where(
          and(
            eq(coverageSignals.siteId, siteId),
            lte(coverageSignals.windowStart, end),
            gte(coverageSignals.windowEnd, start)
          )
        )
        .orderBy(desc(coverageSignals.createdAt))
        .limit(1);
    } catch (coverageError) {
      latestCoverage = [];
    }

    // Determine readiness signal (diagnostic language only)
    let readinessSignal = 'Assessment in progress';
    const hasAuthorityData = latestAuthority.length > 0;
    const hasConfusionData = latestConfusion.length > 0;
    const hasCoverageData = latestCoverage.length > 0;

    if (hasAuthorityData && hasConfusionData && hasCoverageData) {
      const authorityScore = latestAuthority[0]?.authorityScore || 0;
      const confusionCount = latestConfusion.reduce((sum, c) => sum + (c.score || 0), 0);
      const coverageGaps = latestCoverage[0]?.gaps as Array<{ label: string }> | undefined;

      if (authorityScore >= 70 && confusionCount < 10 && (!coverageGaps || coverageGaps.length < 3)) {
        readinessSignal = 'Optimisation surface expanding, with remaining funnel friction';
      } else if (authorityScore >= 50) {
        readinessSignal = 'Technical readiness improving, conversion architecture needs attention';
      } else {
        readinessSignal = 'Multiple constraints identified, optimisation focus required';
      }
    }

    // 2. Optimisation Axes Snapshot (4 quadrants)
    const technicalReadiness = {
      status: 'Stable' as 'Improving' | 'Stable' | 'Constrained',
      pagePerformanceTrends: 'No significant changes',
      crawlIndexNotes: 'Coverage assessment pending',
      outstandingBlockers: [] as string[],
      framing: 'Technical friction static',
    };

    if (hasAuthorityData) {
      const auth = latestAuthority[0];
      const blockers = (auth.blockers as string[] | undefined) || [];
      if (auth.authorityScore >= 70) {
        technicalReadiness.status = 'Improving';
        technicalReadiness.framing = 'Technical friction reducing';
      } else if (auth.authorityScore < 50) {
        technicalReadiness.status = 'Constrained';
        technicalReadiness.framing = 'Technical friction emerging';
      }
      technicalReadiness.outstandingBlockers = blockers.slice(0, 3);
    }

    const conversionArchitecture = {
      status: 'Partially Coherent' as 'Clarifying' | 'Partially Coherent' | 'Fragmented',
      primaryFrictionPoint: 'User journey assessment pending',
      improvementsSinceLastPeriod: [] as string[],
      framing: 'User journey clarity improving, with remaining drop-off risk',
    };

    if (hasConfusionData) {
      const deadEnds = latestConfusion.find((c) => c.type === 'dead_end');
      const dropOffs = latestConfusion.find((c) => c.type === 'drop_off');
      const repeatedSearches = latestConfusion.find((c) => c.type === 'repeated_search');

      if (deadEnds && deadEnds.score > 5) {
        conversionArchitecture.status = 'Fragmented';
        conversionArchitecture.primaryFrictionPoint = 'Dead-end pages identified in user journeys';
        conversionArchitecture.framing = 'User journey clarity improving, with remaining drop-off risk at mid-intent pages';
      } else if (repeatedSearches && repeatedSearches.score > 3) {
        conversionArchitecture.status = 'Partially Coherent';
        conversionArchitecture.primaryFrictionPoint = 'Repeated searches indicate intent mismatch';
      } else {
        conversionArchitecture.status = 'Clarifying';
      }
    }

    const contentSignalQuality = {
      status: 'Uneven' as 'Strengthening' | 'Uneven' | 'Weak',
      authoritySignalDensity: 'Moderate',
      intentAlignmentNotes: 'Assessment in progress',
      proofGaps: [] as string[],
      framing: 'Signal strength improving, but still weak for high-intent buyers',
    };

    if (hasCoverageData) {
      const coverage = latestCoverage[0];
      const gaps = (coverage.gaps as Array<{ label: string; severity: string }> | undefined) || [];
      const missingIntents = (coverage.missingIntents as string[] | undefined) || [];

      if (gaps.length === 0 && missingIntents.length === 0) {
        contentSignalQuality.status = 'Strengthening';
        contentSignalQuality.framing = 'Signal strength improving';
      } else if (gaps.length > 5 || missingIntents.length > 3) {
        contentSignalQuality.status = 'Weak';
        contentSignalQuality.framing = 'Signal strength weak for high-intent buyers';
      }

      contentSignalQuality.proofGaps = gaps
        .filter((g) => g.severity === 'high')
        .map((g) => g.label)
        .slice(0, 3);
    }

    const growthReadiness = {
      status: 'Cautious' as 'Suitable' | 'Cautious' | 'Not Ready',
      paidAmplificationSuitability: 'Directional assessment pending',
      measurementHooksPresent: false,
      scalabilityConstraints: [] as string[],
      framing: 'Environment increasingly suitable for amplification — amplification ≠ results',
    };

    if (hasAuthorityData && hasConfusionData) {
      const auth = latestAuthority[0];
      const blockers = (auth.blockers as string[] | undefined) || [];

      if (auth.authorityScore >= 70 && latestConfusion.reduce((sum, c) => sum + (c.score || 0), 0) < 10) {
        growthReadiness.status = 'Suitable';
        growthReadiness.measurementHooksPresent = true;
      } else if (auth.authorityScore < 50 || blockers.length > 3) {
        growthReadiness.status = 'Not Ready';
        growthReadiness.scalabilityConstraints = blockers.slice(0, 2);
      }
    }

    // 3. Constraint Register
    const constraints: Array<{
      status: 'Active' | 'Resolved' | 'Emerging';
      constraint: string;
      type: 'Structural' | 'Technical' | 'Messaging' | 'Measurement' | 'External';
    }> = [];

    if (hasAuthorityData) {
      const blockers = (latestAuthority[0]?.blockers as string[] | undefined) || [];
      blockers.forEach((blocker) => {
        constraints.push({
          status: 'Active',
          constraint: blocker,
          type: 'Technical',
        });
      });
    }

    if (hasConfusionData) {
      const deadEnds = latestConfusion.find((c) => c.type === 'dead_end');
      if (deadEnds && deadEnds.score > 5) {
        constraints.push({
          status: 'Active',
          constraint: 'Funnel drop-off at mid-intent pages',
          type: 'Structural',
        });
      }
    }

    if (hasCoverageData) {
      const coverage = latestCoverage[0];
      const gaps = (coverage.gaps as Array<{ label: string; severity: string }> | undefined) || [];
      const highSeverityGaps = gaps.filter((g) => g.severity === 'high');
      if (highSeverityGaps.length > 0) {
        constraints.push({
          status: 'Emerging',
          constraint: 'Proof density for enterprise buyers',
          type: 'Messaging',
        });
      }
    }

    // 4. Change Log
    let recentUpdates: Array<{ fromVersion: string; toVersion: string; appliedAt: Date | null; createdAt: Date }> = [];
    try {
      recentUpdates = await db
        .select({
          id: updateHistory.id,
          fromVersion: updateHistory.fromVersion,
          toVersion: updateHistory.toVersion,
          appliedAt: updateHistory.appliedAt,
          createdAt: updateHistory.createdAt,
        })
        .from(updateHistory)
        .where(
          and(
            eq(updateHistory.siteId, siteId),
            gte(updateHistory.createdAt, start),
            lte(updateHistory.createdAt, end)
          )
        )
        .orderBy(desc(updateHistory.createdAt))
        .limit(10);
    } catch (updateError) {
      recentUpdates = [];
    }

    const changeLog = recentUpdates.map((update) => ({
      change: `Config updated from ${update.fromVersion} to ${update.toVersion}`,
      timestamp: update.appliedAt || update.createdAt,
      applied: !!update.appliedAt,
    }));

    // Add note about what did not change if no updates in period
    if (recentUpdates.length === 0) {
      changeLog.push({
        change: 'No config changes in this period — optimisation continues at current depth',
        timestamp: new Date(),
        applied: true,
      });
    }

    // 5. Directional Signals (directional only, no attribution)
    let rollups: Array<{ visits: number; day: Date }> = [];
    try {
      rollups = await db
        .select()
        .from(dashboardRollupsDaily)
        .where(
          and(
            eq(dashboardRollupsDaily.siteId, siteId),
            gte(dashboardRollupsDaily.day, start),
            lte(dashboardRollupsDaily.day, end)
          )
        )
        .orderBy(desc(dashboardRollupsDaily.day))
        .limit(30);
    } catch (rollupError) {
      rollups = [];
    }

    let trafficTrend: '↑' | '→' | '↓' = '→';
    let engagementNotes = 'Insufficient data for trend analysis';

    if (rollups.length >= 2) {
      const recent = rollups[0];
      const older = rollups[rollups.length - 1];
      const visitsDelta = recent.visits - older.visits;
      const visitsChangePercent = older.visits > 0 ? (visitsDelta / older.visits) * 100 : 0;

      if (visitsChangePercent > 10) {
        trafficTrend = '↑';
      } else if (visitsChangePercent < -10) {
        trafficTrend = '↓';
      }

      engagementNotes = `Traffic patterns show ${trafficTrend === '↑' ? 'increasing' : trafficTrend === '↓' ? 'decreasing' : 'stable'} activity`;
    }

    // Only include directional signals if data exists
    const directionalSignals = rollups.length >= 2 ? {
      trafficTrend,
      engagementNotes,
      funnelProgressionSignals: 'High-level funnel assessment pending',
      disclaimer: 'Signals are directional only and cannot be attributed to GPTO in isolation.',
    } : null;

    // 6. Risk & Expectation Control (Gold-only)
    const riskExpectations = [
      'Where spend increases would amplify risk: Technical constraints must be resolved before scaling paid acquisition',
      'Where optimisation returns are likely to slow: Content signal quality improvements require sustained effort',
      'Where client expectations commonly drift: Diagnostic intelligence does not guarantee conversion outcomes',
    ];

    if (constraints.length > 3) {
      riskExpectations.unshift('Multiple active constraints indicate amplification risk without prerequisite resolution');
    }

    // 7. Next Logical Focus
    let nextFocus = 'Continue optimisation at current depth';
    if (constraints.some((c) => c.status === 'Active' && c.type === 'Technical')) {
      nextFocus = 'Remove prerequisite constraint';
    } else if (constraints.length > 5) {
      nextFocus = 'Hold and stabilise before amplification';
    }

    return NextResponse.json({
      site: {
        id: site.id,
        domain: site.domain,
        tier: 'GOLD',
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      executiveSignalBar: {
        tier: 'GOLD',
        assessmentScope: 'Website optimisation & growth readiness',
        period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        readinessSignal,
      },
      optimisationAxes: {
        technicalReadiness,
        conversionArchitecture,
        contentSignalQuality,
        growthReadiness,
      },
      constraintRegister: constraints,
      changeLog,
      directionalSignals: directionalSignals || null,
      riskExpectationControl: riskExpectations,
      nextLogicalFocus: nextFocus,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Error fetching Gold Dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch Gold Dashboard data' }, { status: 500 });
  }
}
