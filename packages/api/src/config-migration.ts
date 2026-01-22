/**
 * Config migration utilities
 * Migrates old config structures to new schema format
 */

interface OldConfig {
  panthera_blackbox?: {
    telemetry?: {
      enabled?: boolean;
      endpoint?: string;
    };
    policy?: {
      require_approval?: boolean;
      allow_rollback?: boolean;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface NewConfig {
  panthera_blackbox: {
    version: string;
    site: {
      domain: string;
      brand: string;
      verticals: string[];
      geo: string[];
    };
    telemetry: {
      emit: boolean;
      keys: string[];
    };
    policy: {
      privacy_mode: 'anon' | 'full' | 'minimal';
      log_level: 'basic' | 'detailed' | 'verbose';
    };
    [key: string]: unknown;
  };
}

/**
 * Migrate old config structure to new schema format
 */
export function migrateConfig(config: unknown): unknown {
  if (!config || typeof config !== 'object') {
    return config;
  }

  const oldConfig = config as OldConfig;
  
  // Check if this is an old config that needs migration
  const needsMigration = 
    oldConfig.panthera_blackbox?.telemetry?.enabled !== undefined ||
    oldConfig.panthera_blackbox?.telemetry?.endpoint !== undefined ||
    oldConfig.panthera_blackbox?.policy?.require_approval !== undefined ||
    oldConfig.panthera_blackbox?.policy?.allow_rollback !== undefined;

  if (!needsMigration) {
    return config;
  }

  // Create migrated config, preserving all existing fields
  const migrated = {
    ...oldConfig,
    panthera_blackbox: {
      ...oldConfig.panthera_blackbox,
      telemetry: {
        // Migrate old telemetry fields
        emit: oldConfig.panthera_blackbox?.telemetry?.enabled ?? 
              (oldConfig.panthera_blackbox?.telemetry?.emit ?? true),
        keys: oldConfig.panthera_blackbox?.telemetry?.keys ?? 
              (oldConfig.panthera_blackbox?.telemetry?.endpoint 
                ? [oldConfig.panthera_blackbox.telemetry.endpoint]
                : []),
        // Preserve any other telemetry fields
        ...(oldConfig.panthera_blackbox?.telemetry || {}),
      },
      policy: {
        // Migrate old policy fields
        privacy_mode: oldConfig.panthera_blackbox?.policy?.privacy_mode ?? 
                     (oldConfig.panthera_blackbox?.policy?.require_approval 
                       ? 'full' 
                       : 'anon') as 'anon' | 'full' | 'minimal',
        log_level: oldConfig.panthera_blackbox?.policy?.log_level ?? 
                  (oldConfig.panthera_blackbox?.policy?.allow_rollback 
                    ? 'detailed' 
                    : 'basic') as 'basic' | 'detailed' | 'verbose',
        // Preserve any other policy fields
        ...(oldConfig.panthera_blackbox?.policy || {}),
      },
    },
  };

  // Remove old fields that have been migrated
  if (migrated.panthera_blackbox?.telemetry) {
    delete (migrated.panthera_blackbox.telemetry as any).enabled;
    delete (migrated.panthera_blackbox.telemetry as any).endpoint;
  }
  if (migrated.panthera_blackbox?.policy) {
    delete (migrated.panthera_blackbox.policy as any).require_approval;
    delete (migrated.panthera_blackbox.policy as any).allow_rollback;
  }

  return migrated;
}
