import { db } from '@gpto/database';
import { subscriptions, audits } from '@gpto/database/src/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getSubscriptionBySiteId } from '@gpto/billing';
import type { SubscriptionTier } from '@gpto/billing';

export type AuditFrequency = 'on-demand' | 'quarterly' | 'monthly';

export interface ScheduledAudit {
  siteId: string;
  tier: SubscriptionTier;
  frequency: AuditFrequency;
  nextRun: Date;
  lastRun?: Date;
}

/**
 * Schedule audit for a site based on tier
 */
export async function scheduleAudit(
  siteId: string,
  tier: SubscriptionTier,
  frequency: AuditFrequency
): Promise<ScheduledAudit> {
  const nextRun = calculateNextRunDate(frequency);

  return {
    siteId,
    tier,
    frequency,
    nextRun,
  };
}

/**
 * Calculate next run date based on frequency
 */
function calculateNextRunDate(frequency: AuditFrequency): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'on-demand':
    default:
      // For on-demand, set to far future (effectively disabled)
      next.setFullYear(next.getFullYear() + 100);
      break;
  }

  return next;
}

/**
 * Get all sites that need audits
 */
export async function getSitesNeedingAudits(): Promise<Array<{ siteId: string; tier: SubscriptionTier }>> {
  // Get all active subscriptions
  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));

  const sitesNeedingAudits: Array<{ siteId: string; tier: SubscriptionTier }> = [];

  for (const sub of activeSubscriptions) {
    const tier = sub.tier as SubscriptionTier;
    
    // Get frequency based on tier
    const frequency = tier === 'gold' ? 'monthly' : tier === 'silver' ? 'quarterly' : 'on-demand';
    
    if (frequency === 'on-demand') {
      continue; // Skip on-demand audits
    }

    // Get last audit for this site
    const [lastAudit] = await db
      .select()
      .from(audits)
      .where(eq(audits.siteId, sub.siteId))
      .orderBy(audits.createdAt)
      .limit(1);

    if (!lastAudit) {
      // No audit yet, schedule one
      sitesNeedingAudits.push({ siteId: sub.siteId, tier });
      continue;
    }

    // Check if enough time has passed
    const lastAuditDate = lastAudit.createdAt;
    const now = new Date();
    const daysSinceLastAudit = (now.getTime() - lastAuditDate.getTime()) / (1000 * 60 * 60 * 24);

    const daysRequired = frequency === 'monthly' ? 30 : 90; // quarterly = 90 days

    if (daysSinceLastAudit >= daysRequired) {
      sitesNeedingAudits.push({ siteId: sub.siteId, tier });
    }
  }

  return sitesNeedingAudits;
}

/**
 * Schedule audits for all eligible sites
 */
export async function scheduleAuditsForAllSites(): Promise<ScheduledAudit[]> {
  const sitesNeedingAudits = await getSitesNeedingAudits();
  const scheduled: ScheduledAudit[] = [];

  for (const { siteId, tier } of sitesNeedingAudits) {
    const frequency = tier === 'gold' ? 'monthly' : 'quarterly';
    const scheduledAudit = await scheduleAudit(siteId, tier, frequency);
    scheduled.push(scheduledAudit);
  }

  return scheduled;
}
