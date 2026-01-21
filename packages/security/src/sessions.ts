import { db } from '@gpto/database';
import { securitySessions } from '@gpto/database/src/schema';
import { eq, lt } from 'drizzle-orm';
import crypto from 'crypto';
import { CognitiveFingerprint } from './fingerprint';

/**
 * Session management with cognitive fingerprinting
 */

export interface SessionData {
  userId: string;
  fingerprint: CognitiveFingerprint;
  expiresAt: Date;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  fingerprint: CognitiveFingerprint,
  expiresInHours = 24
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await db.insert(securitySessions).values({
    userId,
    fingerprint: JSON.stringify(fingerprint),
    token,
    expiresAt,
  });

  return token;
}

/**
 * Verify session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  const [session] = await db
    .select()
    .from(securitySessions)
    .where(eq(securitySessions.token, token))
    .limit(1);

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    await db.delete(securitySessions).where(eq(securitySessions.id, session.id));
    return null;
  }

  return {
    userId: session.userId,
    fingerprint: JSON.parse(session.fingerprint || '{}') as CognitiveFingerprint,
    expiresAt: session.expiresAt,
  };
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db
    .delete(securitySessions)
    .where(lt(securitySessions.expiresAt, new Date()));

  return result.rowCount || 0;
}
