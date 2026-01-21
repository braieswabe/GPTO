import { JSONSchemaType } from 'ajv';

/**
 * Governance Rule Schema
 * Defines safety rules and policies for the system
 */
export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'approval' | 'block' | 'warn' | 'audit';
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
    value: unknown;
  }[];
  action: {
    type: 'require_approval' | 'block_update' | 'log_warning' | 'audit_only';
    message?: string;
    escalation?: string;
  };
  enabled: boolean;
  priority: number;
  applies_to: string[]; // ['updates', 'content', 'telemetry', etc.]
  created_at: string;
  updated_at: string;
}

export const governanceRuleSchema: JSONSchemaType<GovernanceRule> = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    'rule_type',
    'conditions',
    'action',
    'enabled',
    'priority',
    'applies_to',
    'created_at',
    'updated_at',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    rule_type: { type: 'string', enum: ['approval', 'block', 'warn', 'audit'] },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'operator', 'value'],
        properties: {
          field: { type: 'string' },
          operator: {
            type: 'string',
            enum: ['equals', 'contains', 'greater_than', 'less_than', 'regex'],
          },
          value: {},
        },
      },
    },
    action: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
          enum: ['require_approval', 'block_update', 'log_warning', 'audit_only'],
        },
        message: { type: 'string', nullable: true },
        escalation: { type: 'string', nullable: true },
      },
    },
    enabled: { type: 'boolean' },
    priority: { type: 'number' },
    applies_to: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};
