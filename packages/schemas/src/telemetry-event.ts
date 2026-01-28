
/**
 * Telemetry Event Schema
 * Defines the structure of telemetry events sent from Black Box
 */
export interface TelemetryEvent {
  schema: string;
  tenant: string;
  timestamp: string;
  source: 'blackbox' | 'dashboard' | 'api' | 'servo';
  event_type: 'page_view' | 'interaction' | 'search' | 'custom';
  session_id?: string;
  page?: {
    url?: string;
    path?: string;
    title?: string;
  };
  search?: {
    query?: string;
    results_count?: number;
    selected_result?: string;
  };
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
    'ai.schemaCompleteness'?: number;
    'ai.authoritySignals'?: number;
    'ai.structuredDataQuality'?: number;
    'ai.searchVisibility'?: number;
    [key: string]: number | undefined;
  };
  edges?: Array<{
    type: string;
    target: string;
    weight: number;
  }>;
}

export const telemetryEventSchema = {
  type: 'object',
  required: ['schema', 'tenant', 'timestamp', 'source', 'event_type', 'metrics'],
  properties: {
    schema: { type: 'string' },
    tenant: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    source: { type: 'string', enum: ['blackbox', 'dashboard', 'api', 'servo'] },
    event_type: {
      type: 'string',
      enum: ['page_view', 'interaction', 'search', 'custom'],
    },
    session_id: { type: 'string', nullable: true },
    page: {
      type: 'object',
      nullable: true,
      additionalProperties: false,
      properties: {
        url: { type: 'string', nullable: true },
        path: { type: 'string', nullable: true },
        title: { type: 'string', nullable: true },
      },
      required: [],
    },
    search: {
      type: 'object',
      nullable: true,
      additionalProperties: false,
      properties: {
        query: { type: 'string', nullable: true },
        results_count: { type: 'number', nullable: true },
        selected_result: { type: 'string', nullable: true },
      },
      required: [],
    },
    context: {
      type: 'object',
      nullable: true,
      required: [],
      additionalProperties: true,
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
        'ai.schemaCompleteness': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ai.authoritySignals': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ai.structuredDataQuality': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
        'ai.searchVisibility': { type: 'number', nullable: true, minimum: 0, maximum: 1 },
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
