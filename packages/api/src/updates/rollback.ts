import { db } from '@gpto/database';
import { configVersions, updateHistory, rollbackPoints } from '@gpto/database/src/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Rollback functionality for config updates
 */

/**
 * Rollback to a previous version
 */
export async function rollbackToVersion(
  siteId: string,
  targetVersion: string,
  userId: string
): Promise<void> {
  // Find the target version
  const [targetConfig] = await db
    .select()
    .from(configVersions)
    .where(and(
      eq(configVersions.siteId, siteId),
      eq(configVersions.version, targetVersion)
    ))
    .limit(1);

  if (!targetConfig) {
    throw new Error(`Version ${targetVersion} not found for site ${siteId}`);
  }

  // Get current active version
  const [currentConfig] = await db
    .select()
    .from(configVersions)
    .where(and(
      eq(configVersions.siteId, siteId),
      eq(configVersions.isActive, true)
    ))
    .limit(1);

  if (!currentConfig) {
    throw new Error('No active configuration found');
  }

  // Deactivate current version
  await db
    .update(configVersions)
    .set({ isActive: false })
    .where(eq(configVersions.id, currentConfig.id));

  // Create new version from target (or reactivate target)
  if (targetConfig.configJson) {
    const newVersion = `${targetVersion}-rollback-${Date.now()}`;
    
    await db.insert(configVersions).values({
      siteId,
      version: newVersion,
      configJson: targetConfig.configJson,
      isActive: true,
      createdBy: userId,
    });

    // Record rollback in update history
    await db.insert(updateHistory).values({
      siteId,
      fromVersion: currentConfig.version,
      toVersion: newVersion,
      diff: { type: 'rollback', targetVersion },
      signature: 'rollback',
      appliedAt: new Date(),
      userId,
    });
  } else {
    // Reactivate target version
    await db
      .update(configVersions)
      .set({ isActive: true })
      .where(eq(configVersions.id, targetConfig.id));
  }
}

/**
 * Get rollback points (previous versions that can be rolled back to)
 */
export async function getRollbackPoints(siteId: string, limit = 10) {
  const versions = await db
    .select()
    .from(configVersions)
    .where(eq(configVersions.siteId, siteId))
    .orderBy(configVersions.createdAt)
    .limit(limit);

  return versions.map((v) => ({
    version: v.version,
    createdAt: v.createdAt,
    isActive: v.isActive,
  }));
}
