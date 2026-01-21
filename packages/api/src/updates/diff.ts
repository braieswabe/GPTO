/**
 * Calculate diff between two JSON objects
 * Returns an array of changes (JSON Patch format)
 */

export interface Change {
  path: string;
  operation: 'add' | 'remove' | 'replace' | 'move' | 'copy';
  value?: unknown;
  old_value?: unknown;
}

/**
 * Calculate diff between two objects
 */
export function calculateDiff(oldObj: unknown, newObj: unknown, path = ''): Change[] {
  const changes: Change[] = [];

  // If both are primitives or null
  if (oldObj === newObj) {
    return changes;
  }

  // If old is null/undefined, this is an add
  if (oldObj === null || oldObj === undefined) {
    changes.push({
      path,
      operation: 'add',
      value: newObj,
    });
    return changes;
  }

  // If new is null/undefined, this is a remove
  if (newObj === null || newObj === undefined) {
    changes.push({
      path,
      operation: 'remove',
      old_value: oldObj,
    });
    return changes;
  }

  // If types don't match, it's a replace
  if (typeof oldObj !== typeof newObj) {
    changes.push({
      path,
      operation: 'replace',
      value: newObj,
      old_value: oldObj,
    });
    return changes;
  }

  // If both are arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const maxLength = Math.max(oldObj.length, newObj.length);
    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}/${i}` : `/${i}`;
      if (i >= oldObj.length) {
        changes.push({
          path: itemPath,
          operation: 'add',
          value: newObj[i],
        });
      } else if (i >= newObj.length) {
        changes.push({
          path: itemPath,
          operation: 'remove',
          old_value: oldObj[i],
        });
      } else {
        changes.push(...calculateDiff(oldObj[i], newObj[i], itemPath));
      }
    }
    return changes;
  }

  // If both are objects
  if (typeof oldObj === 'object' && typeof newObj === 'object' && !Array.isArray(oldObj) && !Array.isArray(newObj)) {
    const oldKeys = new Set(Object.keys(oldObj as Record<string, unknown>));
    const newKeys = new Set(Object.keys(newObj as Record<string, unknown>));

    // Check for removed keys
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        changes.push({
          path: path ? `${path}/${key}` : `/${key}`,
          operation: 'remove',
          old_value: (oldObj as Record<string, unknown>)[key],
        });
      }
    }

    // Check for added/modified keys
    for (const key of newKeys) {
      const itemPath = path ? `${path}/${key}` : `/${key}`;
      if (!oldKeys.has(key)) {
        changes.push({
          path: itemPath,
          operation: 'add',
          value: (newObj as Record<string, unknown>)[key],
        });
      } else {
        changes.push(
          ...calculateDiff(
            (oldObj as Record<string, unknown>)[key],
            (newObj as Record<string, unknown>)[key],
            itemPath
          )
        );
      }
    }
    return changes;
  }

  // Primitive values - replace
  changes.push({
    path,
    operation: 'replace',
    value: newObj,
    old_value: oldObj,
  });

  return changes;
}
