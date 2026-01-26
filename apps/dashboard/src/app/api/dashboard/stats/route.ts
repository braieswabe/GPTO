import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { telemetryEvents, updateHistory, sites, audits } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { sql, desc, and, inArray } from 'drizzle-orm';

/**
 * GET /api/dashboard/stats
 * 
 * Get aggregated dashboard statistics including:
 * - Total telemetry events count
 * - Total updates count
 * - Authority delta (change in authority score over time)
 * - Recent activities (telemetry events, updates, audits)
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

    // Get all sites for the user (for now, get all sites - can be filtered by tenantId later)
    const allSites = await db.select({ id: sites.id }).from(sites);
    const siteIds = allSites.map(s => s.id);

    // If no sites, return empty stats
    if (siteIds.length === 0) {
      return NextResponse.json({
        telemetryEvents: 0,
        updates: 0,
        authorityDelta: 0,
        recentActivities: [],
      });
    }

    // Count total telemetry events
    const [telemetryCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryEvents)
      .where(inArray(telemetryEvents.siteId, siteIds));
    const telemetryEventsCount = Number(telemetryCountResult?.count || 0);

    // Count total updates (non-rolled-back)
    const [updatesCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(updateHistory)
      .where(
        and(
          inArray(updateHistory.siteId, siteIds),
          sql`${updateHistory.rolledBackAt} IS NULL`
        )
      );
    const updatesCount = Number(updatesCountResult?.count || 0);

    // Calculate authority delta
    // Get the most recent and oldest telemetry events with authority metrics
    const recentTelemetry = await db
      .select({
        metrics: telemetryEvents.metrics,
        timestamp: telemetryEvents.timestamp,
      })
      .from(telemetryEvents)
      .where(inArray(telemetryEvents.siteId, siteIds))
      .orderBy(desc(telemetryEvents.timestamp))
      .limit(100);

    // Calculate authority delta from recent telemetry
    let authorityDelta = 0;
    if (recentTelemetry.length > 0) {
      // Get authority values from metrics
      const authorityValues = recentTelemetry
        .map(t => {
          const metrics = t.metrics as Record<string, number>;
          return metrics?.['ts.authority'] || metrics?.['authority'] || null;
        })
        .filter((v): v is number => v !== null);

      if (authorityValues.length >= 2) {
        // Compare first (most recent) with last (oldest in this batch)
        const recent = authorityValues[0];
        const older = authorityValues[authorityValues.length - 1];
        authorityDelta = Math.round((recent - older) * 100) / 100; // Round to 2 decimals
      }
    }

    // Get recent activities (last 20 items)
    const recentActivities: Array<{
      type: 'telemetry' | 'update' | 'audit';
      id: string;
      siteId: string;
      siteDomain?: string;
      timestamp: Date;
      description: string;
    }> = [];

    // Get recent telemetry events (last 10)
    const recentTelemetryEvents = await db
      .select({
        id: telemetryEvents.id,
        siteId: telemetryEvents.siteId,
        timestamp: telemetryEvents.timestamp,
        source: telemetryEvents.source,
      })
      .from(telemetryEvents)
      .where(inArray(telemetryEvents.siteId, siteIds))
      .orderBy(desc(telemetryEvents.timestamp))
      .limit(10);

    // Get site domains for telemetry events
    const telemetrySiteIds = [...new Set(recentTelemetryEvents.map(t => t.siteId))];
    const telemetrySites = telemetrySiteIds.length > 0
      ? await db
          .select({ id: sites.id, domain: sites.domain })
          .from(sites)
          .where(inArray(sites.id, telemetrySiteIds))
      : [];

    const siteDomainMap = new Map(telemetrySites.map(s => [s.id, s.domain]));

    recentTelemetryEvents.forEach(event => {
      recentActivities.push({
        type: 'telemetry',
        id: event.id,
        siteId: event.siteId,
        siteDomain: siteDomainMap.get(event.siteId),
        timestamp: event.timestamp,
        description: `Telemetry event from ${event.source}`,
      });
    });

    // Get recent updates (last 10)
    const recentUpdates = await db
      .select({
        id: updateHistory.id,
        siteId: updateHistory.siteId,
        timestamp: updateHistory.createdAt,
        fromVersion: updateHistory.fromVersion,
        toVersion: updateHistory.toVersion,
      })
      .from(updateHistory)
      .where(inArray(updateHistory.siteId, siteIds))
      .orderBy(desc(updateHistory.createdAt))
      .limit(10);

    // Get site domains for updates
    const updateSiteIds = [...new Set(recentUpdates.map(u => u.siteId))];
    const updateSites = updateSiteIds.length > 0
      ? await db
          .select({ id: sites.id, domain: sites.domain })
          .from(sites)
          .where(inArray(sites.id, updateSiteIds))
      : [];

    const updateSiteDomainMap = new Map(updateSites.map(s => [s.id, s.domain]));

    recentUpdates.forEach(update => {
      recentActivities.push({
        type: 'update',
        id: update.id,
        siteId: update.siteId,
        siteDomain: updateSiteDomainMap.get(update.siteId),
        timestamp: update.createdAt,
        description: `Config updated from ${update.fromVersion} to ${update.toVersion}`,
      });
    });

    // Get recent audits (last 10)
    const recentAudits = await db
      .select({
        id: audits.id,
        siteId: audits.siteId,
        timestamp: audits.createdAt,
        type: audits.type,
        status: audits.status,
      })
      .from(audits)
      .where(inArray(audits.siteId, siteIds))
      .orderBy(desc(audits.createdAt))
      .limit(10);

    // Get site domains for audits
    const auditSiteIds = [...new Set(recentAudits.map(a => a.siteId))];
    const auditSites = auditSiteIds.length > 0
      ? await db
          .select({ id: sites.id, domain: sites.domain })
          .from(sites)
          .where(inArray(sites.id, auditSiteIds))
      : [];

    const auditSiteDomainMap = new Map(auditSites.map(s => [s.id, s.domain]));

    recentAudits.forEach(audit => {
      recentActivities.push({
        type: 'audit',
        id: audit.id,
        siteId: audit.siteId,
        siteDomain: auditSiteDomainMap.get(audit.siteId),
        timestamp: audit.createdAt,
        description: `${audit.type} audit ${audit.status}`,
      });
    });

    // Sort all activities by timestamp (most recent first) and limit to 20
    recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topActivities = recentActivities.slice(0, 20);

    return NextResponse.json({
      telemetryEvents: telemetryEventsCount,
      updates: updatesCount,
      authorityDelta,
      recentActivities: topActivities.map(activity => ({
        type: activity.type,
        id: activity.id,
        siteId: activity.siteId,
        siteDomain: activity.siteDomain,
        timestamp: activity.timestamp.toISOString(),
        description: activity.description,
      })),
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
