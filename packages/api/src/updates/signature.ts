import crypto from 'crypto';

/**
 * JSON signing and verification using HMAC-SHA256
 * For production, consider using Ed25519 for better security
 */

const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || process.env.JWT_SECRET || 'change-me';

/**
 * Sign a JSON object
 */
export function signJson(data: unknown): string {
  const jsonString = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', SIGNATURE_SECRET);
  hmac.update(jsonString);
  return hmac.digest('hex');
}

/**
 * Verify a signature against data
 */
export function verifySignature(data: unknown, signature: string): boolean {
  const expectedSignature = signJson(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Sign an update patch
 */
export function signUpdate(update: {
  site_id: string;
  from_version: string;
  to_version: string;
  changes: unknown[];
}): string {
  return signJson({
    site_id: update.site_id,
    from_version: update.from_version,
    to_version: update.to_version,
    changes: update.changes,
    timestamp: new Date().toISOString(),
  });
}
