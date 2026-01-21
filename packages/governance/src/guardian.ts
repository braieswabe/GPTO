import { GovernanceRule } from '@gpto/schemas/src/governance-rule';
import { UpdatePatch } from '@gpto/schemas/src/update-patch';

/**
 * Guardian - Pre-approval validation and policy enforcement
 */

export interface GuardianResult {
  approved: boolean;
  blocked: boolean;
  warnings: string[];
  requiredApprovals: string[];
  reason?: string;
}

/**
 * Check if update passes Guardian rules
 */
export function checkGuardianRules(
  update: UpdatePatch,
  rules: GovernanceRule[]
): GuardianResult {
  const warnings: string[] = [];
  const requiredApprovals: string[] = [];
  let blocked = false;

  // Check each rule
  for (const rule of rules.filter((r) => r.enabled)) {
    if (!rule.applies_to.includes('updates')) {
      continue;
    }

    // Check conditions
    const matches = checkRuleConditions(update, rule);
    
    if (matches) {
      switch (rule.action.type) {
        case 'block_update':
          blocked = true;
          return {
            approved: false,
            blocked: true,
            warnings: [],
            requiredApprovals: [],
            reason: rule.action.message || 'Update blocked by governance rule',
          };

        case 'require_approval':
          requiredApprovals.push(rule.id);
          warnings.push(rule.action.message || `Approval required: ${rule.name}`);
          break;

        case 'log_warning':
          warnings.push(rule.action.message || `Warning: ${rule.name}`);
          break;

        case 'audit_only':
          // Just log, no action needed
          break;
      }
    }
  }

  return {
    approved: !blocked && requiredApprovals.length === 0,
    blocked,
    warnings,
    requiredApprovals,
  };
}

/**
 * Check if update matches rule conditions
 */
function checkRuleConditions(update: UpdatePatch, rule: GovernanceRule): boolean {
  for (const condition of rule.conditions) {
    const value = getNestedValue(update, condition.field);
    const matches = evaluateCondition(value, condition.operator, condition.value);
    
    if (!matches) {
      return false;
    }
  }
  return true;
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Evaluate condition
 */
function evaluateCondition(value: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'equals':
      return value === expected;
    case 'contains':
      return String(value).includes(String(expected));
    case 'greater_than':
      return Number(value) > Number(expected);
    case 'less_than':
      return Number(value) < Number(expected);
    case 'regex':
      return new RegExp(String(expected)).test(String(value));
    default:
      return false;
  }
}

/**
 * Check compliance (EEOC, GDPR, CCPA)
 */
export function checkCompliance(
  update: UpdatePatch,
  region: 'US' | 'EU' | 'CA' = 'US'
): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  // EEOC compliance (US)
  if (region === 'US') {
    // Check for discriminatory language
    const discriminatoryTerms = ['age', 'race', 'gender', 'religion'];
    const updateStr = JSON.stringify(update);
    for (const term of discriminatoryTerms) {
      if (updateStr.toLowerCase().includes(term)) {
        issues.push(`Potential EEOC concern: mentions ${term}`);
      }
    }
  }

  // GDPR compliance (EU)
  if (region === 'EU') {
    // Check for PII handling
    if (update.changes.some((c) => c.path.includes('personal_data'))) {
      issues.push('GDPR: Personal data handling requires consent mechanism');
    }
  }

  // CCPA compliance (CA)
  if (region === 'CA') {
    // Similar checks for California privacy
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}
