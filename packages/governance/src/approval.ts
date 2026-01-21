import { db } from '@gpto/database';
import { approvals, updateHistory, configVersions } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Approval workflow management
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  updateId: string;
  approverId: string;
  status: ApprovalStatus;
  reason?: string;
}

/**
 * Create approval request
 */
export async function createApproval(updateId: string): Promise<string> {
  const [approval] = await db
    .insert(approvals)
    .values({
      updateId,
      status: 'pending',
    })
    .returning();

  return approval.id;
}

/**
 * Approve or reject an update
 */
export async function processApproval(
  approvalId: string,
  approverId: string,
  status: ApprovalStatus,
  reason?: string
): Promise<void> {
  await db
    .update(approvals)
    .set({
      status,
      approvedBy: status === 'approved' ? approverId : undefined,
      approvedAt: status === 'approved' ? new Date() : undefined,
      rejectedReason: status === 'rejected' ? reason : undefined,
      updatedAt: new Date(),
    })
    .where(eq(approvals.id, approvalId));

  // If approved, activate the config version
  if (status === 'approved') {
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, approvalId))
      .limit(1);

    if (approval) {
      const [update] = await db
        .select()
        .from(updateHistory)
        .where(eq(updateHistory.id, approval.updateId))
        .limit(1);

      if (update) {
        // Deactivate current active version
        await db
          .update(configVersions)
          .set({ isActive: false })
          .where(and(
            eq(configVersions.siteId, update.siteId),
            eq(configVersions.isActive, true)
          ));

        // Activate new version
        await db
          .update(configVersions)
          .set({ isActive: true })
          .where(and(
            eq(configVersions.siteId, update.siteId),
            eq(configVersions.version, update.toVersion)
          ));

        // Mark update as applied
        await db
          .update(updateHistory)
          .set({ appliedAt: new Date() })
          .where(eq(updateHistory.id, update.id));
      }
    }
  }
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(limit = 50) {
  return db
    .select()
    .from(approvals)
    .where(eq(approvals.status, 'pending'))
    .limit(limit);
}
