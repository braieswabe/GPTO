import cron from 'node-cron';
import { getSitesNeedingAudits } from './scheduler';
import { runTechnicalAudit } from '@gpto/audit';
import { db } from '@gpto/database';
import { audits } from '@gpto/database/src/schema';
import type { SubscriptionTier } from '@gpto/billing';

/**
 * Run scheduled audits (to be called by cron job)
 */
export async function runScheduledAudits(): Promise<void> {
  console.log('[Scheduler] Running scheduled audits...');
  
  const sitesNeedingAudits = await getSitesNeedingAudits();
  
  console.log(`[Scheduler] Found ${sitesNeedingAudits.length} sites needing audits`);

  for (const { siteId, tier } of sitesNeedingAudits) {
    try {
      console.log(`[Scheduler] Running audit for site ${siteId} (${tier} tier)`);
      
      // Run technical audit
      const technicalAudit = await runTechnicalAudit(siteId);
      
      // Store audit result
      await db.insert(audits).values({
        siteId,
        tier,
        type: 'technical',
        status: 'completed',
        results: technicalAudit as unknown as Record<string, unknown>,
        createdAt: new Date(),
        completedAt: new Date(),
      });

      console.log(`[Scheduler] Completed audit for site ${siteId}`);
    } catch (error) {
      console.error(`[Scheduler] Error running audit for site ${siteId}:`, error);
      
      // Store failed audit
      await db.insert(audits).values({
        siteId,
        tier,
        type: 'technical',
        status: 'failed',
        results: { error: String(error) } as unknown as Record<string, unknown>,
        createdAt: new Date(),
      });
    }
  }

  console.log('[Scheduler] Finished running scheduled audits');
}

/**
 * Setup cron jobs for audit scheduling
 */
export function setupCronJobs(): void {
  // Run daily at 2 AM to check for sites needing audits
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Daily audit check triggered');
    await runScheduledAudits();
  });

  console.log('[Cron] Scheduled audit cron jobs initialized');
}

/**
 * Start cron scheduler (call this in your app initialization)
 */
export function startScheduler(): void {
  setupCronJobs();
  console.log('[Scheduler] Audit scheduler started');
}
