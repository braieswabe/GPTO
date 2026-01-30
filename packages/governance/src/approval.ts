import { db } from '@gpto/database';
import { approvals, updateHistory, configVersions, rollbackPoints } from '@gpto/database/src/schema';
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
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:54',message:'Approval processing started',data:{approvalId,status,approverId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, approvalId))
      .limit(1);

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:61',message:'Approval record fetched',data:{hasApproval:!!approval,approvalId:approval?.id,updateId:approval?.updateId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (approval) {
      const [update] = await db
        .select()
        .from(updateHistory)
        .where(eq(updateHistory.id, approval.updateId))
        .limit(1);

      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:68',message:'Update record fetched',data:{hasUpdate:!!update,siteId:update?.siteId,toVersion:update?.toVersion},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (update) {
        const [currentConfig] = await db
          .select()
          .from(configVersions)
          .where(and(
            eq(configVersions.siteId, update.siteId),
            eq(configVersions.isActive, true)
          ))
          .limit(1);

        if (currentConfig) {
          const existingRollback = await db
            .select({ id: rollbackPoints.id })
            .from(rollbackPoints)
            .where(eq(rollbackPoints.updateId, update.id))
            .limit(1);

          if (existingRollback.length === 0) {
            await db.insert(rollbackPoints).values({
              updateId: update.id,
              siteId: update.siteId,
              version: currentConfig.version,
              configSnapshot: currentConfig.configJson,
            });
          }
        }

        // Deactivate current active version
        await db
          .update(configVersions)
          .set({ isActive: false })
          .where(and(
            eq(configVersions.siteId, update.siteId),
            eq(configVersions.isActive, true)
          ));

        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:75',message:'Deactivated old config version',data:{siteId:update.siteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // Activate new version
        await db
          .update(configVersions)
          .set({ isActive: true })
          .where(and(
            eq(configVersions.siteId, update.siteId),
            eq(configVersions.version, update.toVersion)
          ));

        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:85',message:'Activated new config version',data:{siteId:update.siteId,version:update.toVersion},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // Mark update as applied
        await db
          .update(updateHistory)
          .set({ appliedAt: new Date() })
          .where(eq(updateHistory.id, update.id));

        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'governance/approval.ts:93',message:'Approval process completed',data:{siteId:update.siteId,version:update.toVersion},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
