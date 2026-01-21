/**
 * Truth Density Meter (TDM)
 * Quantifies coherence and grounding of reasoning output
 */

import { APMWeights, APMInputs } from './apm';
import { ARCResult } from './arc-cluster';

export interface TDMResult {
  truthDensity: number; // 0-1, overall truth density score
  coherence: number; // 0-1, internal consistency
  grounding: number; // 0-1, connection to facts/evidence
  confidence: number; // 0-1, confidence in the measurement
  factors: {
    arcScore: number;
    apmVerifyWeight: number;
    driftPenalty: number;
    coherenceBonus: number;
  };
}

/**
 * Calculate Truth Density Meter score
 */
export function calculateTDM(
  arcResult: ARCResult,
  apmWeights: APMWeights,
  apmInputs: APMInputs,
  hasEvidence: boolean = false
): TDMResult {
  // Base score from ARC cluster
  const arcScore = arcResult.finalScore;
  
  // Verify weight contribution (higher verify weight = higher truth density)
  const apmVerifyWeight = apmWeights.w_vf;
  
  // Drift penalty (high drift = lower truth density)
  const driftPenalty = 1 - Math.min(apmInputs.drift, 0.5); // Cap penalty at 0.5
  
  // Coherence bonus
  const coherenceBonus = apmInputs.coherence;
  
  // Grounding score (evidence availability)
  const grounding = hasEvidence ? 0.9 : 0.5;
  
  // Calculate components
  const coherence = coherenceBonus * (1 - apmInputs.drift);
  const truthDensity = (
    arcScore * 0.3 +
    apmVerifyWeight * 0.25 +
    driftPenalty * 0.2 +
    coherenceBonus * 0.15 +
    grounding * 0.1
  );
  
  // Confidence based on how many factors we have
  const confidence = Math.min(1.0, (
    (arcResult.verify.checks.length > 0 ? 0.3 : 0) +
    (apmWeights.w_vf > 0 ? 0.3 : 0) +
    (apmInputs.coherence > 0 ? 0.2 : 0) +
    (hasEvidence ? 0.2 : 0)
  ));
  
  return {
    truthDensity: Math.round(truthDensity * 100) / 100,
    coherence: Math.round(coherence * 100) / 100,
    grounding: Math.round(grounding * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    factors: {
      arcScore: Math.round(arcScore * 100) / 100,
      apmVerifyWeight: Math.round(apmVerifyWeight * 100) / 100,
      driftPenalty: Math.round(driftPenalty * 100) / 100,
      coherenceBonus: Math.round(coherenceBonus * 100) / 100,
    },
  };
}

/**
 * Check if truth density meets threshold
 */
export function meetsTruthThreshold(tdm: TDMResult, threshold: number = 0.7): boolean {
  return tdm.truthDensity >= threshold && tdm.confidence >= 0.5;
}

/**
 * Generate TDM report for debugging/analysis
 */
export function generateTDMReport(tdm: TDMResult): string {
  const status = meetsTruthThreshold(tdm) ? 'PASS' : 'FAIL';
  
  return `
Truth Density Meter Report
==========================
Status: ${status}
Truth Density: ${(tdm.truthDensity * 100).toFixed(1)}%
Coherence: ${(tdm.coherence * 100).toFixed(1)}%
Grounding: ${(tdm.grounding * 100).toFixed(1)}%
Confidence: ${(tdm.confidence * 100).toFixed(1)}%

Factors:
- ARC Score: ${(tdm.factors.arcScore * 100).toFixed(1)}%
- APM Verify Weight: ${(tdm.factors.apmVerifyWeight * 100).toFixed(1)}%
- Drift Penalty: ${(tdm.factors.driftPenalty * 100).toFixed(1)}%
- Coherence Bonus: ${(tdm.factors.coherenceBonus * 100).toFixed(1)}%
`.trim();
}
