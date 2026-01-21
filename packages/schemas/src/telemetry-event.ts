import { JSONSchemaType } from 'ajv';

/**
 * Telemetry Event Schema
 * Defines the structure of telemetry events sent from Black Box
 */
export interface TelemetryEvent {
  schema: string;
  tenant: string;
  timestamp: string;
  source: 'blackbox' | 'dashboard' | 'api' | 'servo';
  context?: {
    intent?: string;
    geo?: string;
    cfp_segment?: string;
    [key: string]: unknown;
  };
  metrics: {
    'ts.intent'?: number;
    'ts.anchor'?: number;
    'ts.authority'?: number;
    'ts.recency'?: number;
    'ts.fairness'?: number;
    'ts.conflict'?: number;
    'ts.rank'?: number;
    entropy?: number;
    coherence?: number;
    drift?: number;
    [key: string]: number | undefined;
  };
  edges?: Array<{
    type: string;
    target: string;
    weight: number;
  }>;
}

export const telemetryEventSchema: JSONSchemaType<TelemetryEvent> = {
  type: 'object',
  required: ['schema', 'tenant', 'timestamp', 'source', 'metrics'],
  properties: {
    schema: { type: 'string' },
    tenant: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string', enum: ['blackbox', 'dashboard', 'api', 'servo'] },
    context: {
      type: 'object',
      nullable: true,
      additionalProperties: true,
      properties: {
        intent: { type: 'string', nullable: true },
        geo: { type: 'string', nullable: true },
        cfp_segment: { type: 'string', nullable: true },
      },
    },
    metrics: {
      type: 'object',
      required: [],
      additionalProperties: { type: 'number' },
      properties: {
        'ts.intent': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.anchor': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.authority': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.recency': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.fairness': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.conflict': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ts.rank': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        entropy: { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        coherence: { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        drift: { type: 'number', nullable: true, minimum: 0, maximum: 1 },
      },
    },
    edges: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        required: ['type', 'target', 'weight'],
        properties: {
          type: { type: 'string' },
          target: { type: 'string' },
          weight: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
};
