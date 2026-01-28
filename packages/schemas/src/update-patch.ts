
/**
 * Update Patch Schema
 * Defines the structure of updates/patches applied to site configs
 */
export interface UpdatePatch {
  site_id: string;
  from_version: string;
  to_version: string;
  patch_type: 'full' | 'partial' | 'merge';
  changes: {
    path: string;
    operation: 'add' | 'remove' | 'replace' | 'move' | 'copy';
    value?: unknown;
    old_value?: unknown;
  }[];
  signature: string;
  signed_by: string;
  signed_at: string;
  metadata?: {
    reason?: string;
    approved_by?: string;
    approved_at?: string;
    [key: string]: unknown;
  };
}

export const updatePatchSchema = {
  type: 'object',
  required: ['site_id', 'from_version', 'to_version', 'patch_type', 'changes', 'signature', 'signed_by', 'signed_at'],
  properties: {
    site_id: { type: 'string' },
    from_version: { type: 'string' },
    to_version: { type: 'string' },
    patch_type: { type: 'string', enum: ['full', 'partial', 'merge'] },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'operation'],
        properties: {
          path: { type: 'string' },
          operation: { type: 'string', enum: ['add', 'remove', 'replace', 'move', 'copy'] },
          value: {},
          old_value: {},
        },
        additionalProperties: false,
      },
    },
    signature: { type: 'string' },
    signed_by: { type: 'string' },
    signed_at: { type: 'string', format: 'date-time' },
    metadata: {
      type: 'object',
      nullable: true,
      required: [],
      additionalProperties: true,
    },
  },
};
