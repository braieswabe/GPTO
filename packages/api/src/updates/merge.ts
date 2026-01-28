import { Change } from './diff';

/**
 * Safely merge changes into an object
 * Applies JSON Patch operations safely
 */

/**
 * Apply a single change to an object
 */
function applyChange(obj: unknown, change: Change): unknown {
  const pathParts = change.path.split('/').filter(Boolean);
  let current: unknown = obj;

  // Navigate to the parent of the target
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current)) {
      current = current[Number(part)];
    } else {
      throw new Error(`Cannot navigate path: ${change.path}`);
    }
  }

  const targetKey = pathParts[pathParts.length - 1];
  const parent = current;

  // Apply the operation
  switch (change.operation) {
    case 'add':
      if (Array.isArray(parent)) {
        const index = targetKey ? Number(targetKey) : parent.length;
        parent.splice(index, 0, change.value);
      } else if (typeof parent === 'object' && parent !== null) {
        (parent as Record<string, unknown>)[targetKey] = change.value;
      }
      break;

    case 'remove':
      if (Array.isArray(parent)) {
        const index = Number(targetKey);
        parent.splice(index, 1);
      } else if (typeof parent === 'object' && parent !== null) {
        delete (parent as Record<string, unknown>)[targetKey];
      }
      break;

    case 'replace':
      if (Array.isArray(parent)) {
        const index = Number(targetKey);
        parent[index] = change.value;
      } else if (typeof parent === 'object' && parent !== null) {
        (parent as Record<string, unknown>)[targetKey] = change.value;
      }
      break;

    case 'move':
    case 'copy':
      // Not implemented for now - can be added if needed
      throw new Error(`Operation ${change.operation} not implemented`);
  }

  return obj;
}

/**
 * Apply multiple changes to an object
 */
export function applyChanges(obj: unknown, changes: Change[]): unknown {
  // Deep clone to avoid mutating original
  const result = JSON.parse(JSON.stringify(obj));

  for (const change of changes) {
    applyChange(result, change);
  }

  return result;
}

/**
 * Merge two configs safely
 */
export function mergeConfigs(_oldConfig: unknown, newConfig: unknown): unknown {
  // For now, new config takes precedence
  // In production, you might want more sophisticated merging logic
  return newConfig;
}
