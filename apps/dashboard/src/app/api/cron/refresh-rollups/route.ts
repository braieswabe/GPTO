import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, dashboardRollupsDaily, authoritySignals, confusionSignals } from '@gpto/database/src/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * POST /api/cron/refresh-rollups
 * 
 * Scheduled job to refresh rollups and signals for all sites.
 * This endpoint should be called by Vercel Cron or similar scheduler.
 * 
 * Security: Protected by Vercel Cron secret or API key
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active sites
    const allSites = await db.select({ id: sites.id }).from(sites);
    
    if (allSites.length === 0) {
      return NextResponse.json({ 
        message: 'No sites found',
        refreshed: 0 
      });
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let refreshedCount = 0;
    const errors: Array<{ siteId: string; error: string }> = [];

    // Refresh rollups and signals for each site
    for (const site of allSites) {
      try {
        const siteId = site.id;
        
        // Import the refresh logic from the dashboard endpoints
        const origin = new URL(request.url).origin;
        const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};
        
        // Refresh telemetry rollups
        await fetch(
          `${origin}/api/dashboard/telemetry?siteId=${siteId}&range=7d&refresh=true`,
          { method: 'GET', headers }
        ).catch(err => {
          console.error(`Failed to refresh telemetry for site ${siteId}:`, err);
        });

        // Refresh authority signals
        await fetch(
          `${origin}/api/dashboard/authority?siteId=${siteId}&range=7d&refresh=true`,
          { method: 'GET', headers }
        ).catch(err => {
          console.error(`Failed to refresh authority for site ${siteId}:`, err);
        });

        // Refresh confusion signals
        await fetch(
          `${origin}/api/dashboard/confusion?siteId=${siteId}&range=7d&refresh=true`,
          { method: 'GET', headers }
        ).catch(err => {
          console.error(`Failed to refresh confusion for site ${siteId}:`, err);
        });

        refreshedCount++;
      } catch (error) {
        errors.push({
          siteId: site.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      message: 'Rollups refresh completed',
      refreshed: refreshedCount,
      total: allSites.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing rollups:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh rollups',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual triggering (with auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
