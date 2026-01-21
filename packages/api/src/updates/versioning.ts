/**
 * Semantic versioning for config updates
 */

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse version string (e.g., "1.2.3")
 */
export function parseVersion(version: string): Version {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Format version object to string
 */
export function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Increment version based on change type
 */
export function incrementVersion(
  currentVersion: string,
  changeType: 'major' | 'minor' | 'patch' = 'patch'
): string {
  const version = parseVersion(currentVersion);
  
  switch (changeType) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
  }
  
  return formatVersion(version);
}

/**
 * Compare two versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);
  
  if (version1.major !== version2.major) {
    return version1.major > version2.major ? 1 : -1;
  }
  if (version1.minor !== version2.minor) {
    return version1.minor > version2.minor ? 1 : -1;
  }
  if (version1.patch !== version2.patch) {
    return version1.patch > version2.patch ? 1 : -1;
  }
  return 0;
}
