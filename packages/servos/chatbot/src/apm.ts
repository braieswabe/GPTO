/**
 * Adaptive Processor Matrix (APM)
 * Dynamically adjusts Pattern-Spotting, Matter-of-Fact, and Verify weights
 */

export interface APMWeights {
  w_ps: number; // Pattern-Spotting weight
  w_mf: number; // Matter-of-Fact weight
  w_vf: number; // Verify weight
}

export interface APMInputs {
  entropy: number; // 0-1
  truth_density: number; // 0-1
  task_risk: number; // 0-1
  drift: number; // 0-1
  coherence: number; // 0-1
  cfp?: {
    focus: number;
    risk: number;
    verbosity: number;
    novelty: number;
  };
}

/**
 * Calculate APM weights based on inputs
 */
export function calculateAPMWeights(inputs: APMInputs): APMWeights {
  // Activation parameters (from plan)
  const alpha = [1.2, 0.8, 0.7, 0.6, 0.5];
  const beta = [1.1, 1.0, 0.9, 0.7, 0.5];
  const gamma = [1.2, 1.1, 0.9, 0.9, 0.6];

  // Calculate raw activations using sigmoid
  const a_ps = sigmoid(
    alpha[0] * (inputs.cfp?.novelty || 0.5) +
    alpha[1] * (1 - inputs.task_risk) +
    alpha[2] * inputs.entropy -
    alpha[3] * inputs.truth_density +
    alpha[4] * inputs.entropy
  );

  const a_mf = sigmoid(
    beta[0] * (inputs.cfp?.focus || 0.5) +
    beta[1] * inputs.task_risk +
    beta[2] * inputs.truth_density -
    beta[3] * inputs.entropy +
    beta[4] * inputs.truth_density
  );

  const a_vf = sigmoid(
    gamma[0] * inputs.task_risk +
    gamma[1] * (1 - inputs.truth_density) +
    gamma[2] * inputs.drift +
    gamma[3] * (1 - inputs.coherence) +
    gamma[4] * (inputs.cfp?.risk || 0.5)
  );

  // Normalize to weights
  const Z = a_ps + a_mf + a_vf + 1e-6;

  return {
    w_ps: a_ps / Z,
    w_mf: a_mf / Z,
    w_vf: a_vf / Z,
  };
}

/**
 * Sigmoid function
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Check if verify should be triggered
 */
export function shouldTriggerVerify(weights: APMWeights, inputs: APMInputs): boolean {
  const vf_soft = 0.35;
  const vf_hard = 0.70;

  return weights.w_vf >= vf_hard || (weights.w_vf >= vf_soft && inputs.task_risk > 0.6);
}
