import crypto from 'crypto';

/**
 * Cognitive Fingerprinting (CFP)
 * Generates unique behavioral signatures for security and personalization
 */

export interface CognitiveFingerprint {
  cf_id: string; // Identity hash
  cf_t: number; // Behavioral trace score
  cti: number; // Cognitive Trust Index (0-1)
}

export interface FingerprintInputs {
  userId: string;
  deviceInfo?: string;
  behaviorPattern?: {
    typingSpeed?: number;
    interactionPattern?: string[];
    sessionDuration?: number;
  };
}

/**
 * Generate Cognitive Fingerprint ID
 */
export function generateCF_ID(inputs: FingerprintInputs): string {
  const data = [
    inputs.userId,
    inputs.deviceInfo || '',
    JSON.stringify(inputs.behaviorPattern || {}),
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Calculate Cognitive Trust Index (CTI)
 */
export function calculateCTI(
  _cf_id: string,
  currentBehavior: FingerprintInputs['behaviorPattern'],
  historicalBehavior?: FingerprintInputs['behaviorPattern']
): number {
  let score = 0.5; // Base score

  // Device consistency
  // (would check device fingerprint in production)
  score += 0.2;

  // Behavior consistency
  if (historicalBehavior && currentBehavior) {
    const consistency = calculateBehaviorConsistency(currentBehavior, historicalBehavior);
    score += consistency * 0.3;
  }

  return Math.min(1.0, score);
}

/**
 * Calculate behavior consistency score
 */
function calculateBehaviorConsistency(
  current: NonNullable<FingerprintInputs['behaviorPattern']>,
  historical: NonNullable<FingerprintInputs['behaviorPattern']>
): number {
  // Simplified consistency check
  // In production, would use more sophisticated pattern matching
  let matches = 0;
  let total = 0;

  if (current.typingSpeed && historical.typingSpeed) {
    const diff = Math.abs(current.typingSpeed - historical.typingSpeed) / historical.typingSpeed;
    matches += diff < 0.2 ? 1 : 0;
    total++;
  }

  return total > 0 ? matches / total : 0.5;
}

/**
 * Generate full cognitive fingerprint
 */
export function generateFingerprint(inputs: FingerprintInputs): CognitiveFingerprint {
  const cf_id = generateCF_ID(inputs);
  const cf_t = 0.8; // Placeholder - would calculate from behavior
  const cti = calculateCTI(cf_id, inputs.behaviorPattern);

  return {
    cf_id,
    cf_t,
    cti,
  };
}

/**
 * Verify fingerprint (check if CTI is above threshold)
 */
export function verifyFingerprint(fingerprint: CognitiveFingerprint, threshold = 0.7): boolean {
  return fingerprint.cti >= threshold;
}
