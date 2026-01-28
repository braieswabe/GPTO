import { classifyIntent, IntentResult } from './intent-engine';
import { generateRoutePlan, RoutePlan } from './mode-router';
import { calculateAPMWeights, APMInputs, APMWeights } from './apm';
import { runARCCluster, shouldTriggerARC } from './arc-cluster';
import { calculateTDM } from './tdm';

/**
 * PantheraChat - Main chatbot orchestrator
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: IntentResult;
    routePlan?: RoutePlan;
    apmWeights?: APMWeights;
  };
}

export interface ChatResponse {
  message: string;
  metadata: {
    mode: string;
    servos: string[];
    apmWeights: APMWeights;
    confidence: number;
    arcResult?: {
      finalScore: number;
      verify: { score: number; checks: Array<{ check: string; passed: boolean }> };
    };
    tdm?: {
      truthDensity: number;
      coherence: number;
      grounding: number;
    };
  };
}

/**
 * Process a chat message and generate response
 */
export async function processChatMessage(
  message: string,
  context?: {
    previousMessages?: ChatMessage[];
    telemetry?: APMInputs;
  }
): Promise<ChatResponse> {
  // Classify intent
  const intent = classifyIntent(message);

  // Generate route plan
  const routePlan = generateRoutePlan(intent);

  // Calculate APM weights
  const apmInputs: APMInputs = {
    entropy: 0.3,
    truth_density: 0.7,
    task_risk: 0.5,
    drift: 0.01,
    coherence: 0.9,
    ...context?.telemetry,
  };

  const apmWeights = calculateAPMWeights(apmInputs);

  // Run ARC Cluster if needed
  let arcResult;
  if (shouldTriggerARC(apmWeights, apmInputs)) {
    arcResult = runARCCluster(message, {}, apmInputs, apmWeights);
  }

  // Calculate TDM if ARC was run
  let tdm;
  if (arcResult) {
    tdm = calculateTDM(arcResult, apmWeights, apmInputs, false);
  }

  // Generate response (placeholder - would call servos in production)
  const response = await generateResponse(message, intent, routePlan, apmWeights, arcResult, tdm);

  return {
    message: response,
    metadata: {
      mode: intent.mode,
      servos: intent.servos,
      apmWeights,
      confidence: intent.confidence,
      arcResult: arcResult ? {
        finalScore: arcResult.finalScore,
        verify: arcResult.verify,
      } : undefined,
      tdm: tdm ? {
        truthDensity: tdm.truthDensity,
        coherence: tdm.coherence,
        grounding: tdm.grounding,
      } : undefined,
    },
  };
}

/**
 * Generate response based on route plan
 */
async function generateResponse(
  _message: string,
  intent: IntentResult,
  routePlan: RoutePlan,
  apmWeights: APMWeights,
  arcResult?: ReturnType<typeof runARCCluster>,
  tdm?: ReturnType<typeof calculateTDM>
): Promise<string> {
  // Placeholder response generation
  // In production, this would:
  // 1. Call appropriate servos based on routePlan
  // 2. Apply APM weights to reasoning
  // 3. Synthesize results into natural language

  const servoList = routePlan.servos.map((s) => s.type).join(', ');
  
  let response = `I understand you want to ${intent.mode}. I'll route this to: ${servoList}.

APM Weights:
- Pattern-Spotting: ${(apmWeights.w_ps * 100).toFixed(0)}%
- Matter-of-Fact: ${(apmWeights.w_mf * 100).toFixed(0)}%
- Verify: ${(apmWeights.w_vf * 100).toFixed(0)}%`;

  if (arcResult) {
    response += `\n\nARC Analysis:
- Final Score: ${(arcResult.finalScore * 100).toFixed(0)}%
- Verify Checks Passed: ${arcResult.verify.checks.filter(c => c.passed).length}/${arcResult.verify.checks.length}`;
  }

  if (tdm) {
    response += `\n\nTruth Density: ${(tdm.truthDensity * 100).toFixed(0)}% (Coherence: ${(tdm.coherence * 100).toFixed(0)}%, Grounding: ${(tdm.grounding * 100).toFixed(0)}%)`;
  }

  response += '\n\n[In production, this would execute the servos and return actual results]';
  
  return response;
}
