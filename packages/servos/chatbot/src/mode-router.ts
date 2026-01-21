import { UserMode, ServoType, IntentResult } from './intent-engine';

/**
 * Mode Router - Routes requests to appropriate servos based on mode
 */

export interface RoutePlan {
  mode: UserMode;
  servos: Array<{
    type: ServoType;
    action: string;
    params: Record<string, unknown>;
  }>;
  order: 'parallel' | 'sequential';
}

/**
 * Generate route plan from intent
 */
export function generateRoutePlan(intent: IntentResult): RoutePlan {
  const servos = intent.servos.map((type) => ({
    type,
    action: getDefaultAction(type, intent.mode),
    params: intent.entities,
  }));

  // Determine execution order
  const order: 'parallel' | 'sequential' =
    intent.mode === 'plan' || intent.mode === 'audit' ? 'parallel' : 'sequential';

  return {
    mode: intent.mode,
    servos,
    order,
  };
}

/**
 * Get default action for servo type and mode
 */
function getDefaultAction(servo: ServoType, mode: UserMode): string {
  const actionMap: Record<string, Record<UserMode, string>> = {
    gpto: {
      ask: 'query',
      plan: 'generate',
      do: 'execute',
      audit: 'analyze',
      explain: 'explain',
      teach: 'tutorial',
      simulate: 'simulate',
      benchmark: 'compare',
    },
    agcc: {
      ask: 'suggest',
      plan: 'outline',
      do: 'generate',
      audit: 'review',
      explain: 'explain',
      teach: 'example',
      simulate: 'draft',
      benchmark: 'compare',
    },
    mibi: {
      ask: 'query',
      plan: 'forecast',
      do: 'analyze',
      audit: 'audit',
      explain: 'explain',
      teach: 'guide',
      simulate: 'project',
      benchmark: 'benchmark',
    },
  };

  return actionMap[servo]?.[mode] || 'process';
}
