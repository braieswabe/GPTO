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
    oldConfig.panthera_blackbox?.telemetry && (
      (oldConfig.panthera_blackbox.telemetry as { enabled?: boolean; endpoint?: string } | undefined)?.enabled !== undefined ||
      (oldConfig.panthera_blackbox.telemetry as { enabled?: boolean; endpoint?: string } | undefined)?.endpoint !== undefined
    ) ||
    oldConfig.panthera_blackbox?.policy && (
      (oldConfig.panthera_blackbox.policy as { require_approval?: boolean; allow_rollback?: boolean } | undefined)?.require_approval !== undefined ||
      (oldConfig.panthera_blackbox.policy as { require_approval?: boolean; allow_rollback?: boolean } | undefined)?.allow_rollback !== undefined
    );

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
        emit: (oldConfig.panthera_blackbox?.telemetry as { enabled?: boolean; emit?: boolean; keys?: string[]; endpoint?: string } | undefined)?.enabled ?? 
              ((oldConfig.panthera_blackbox?.telemetry as { enabled?: boolean; emit?: boolean; keys?: string[]; endpoint?: string } | undefined)?.emit ?? true),
        keys: (oldConfig.panthera_blackbox?.telemetry as { enabled?: boolean; emit?: boolean; keys?: string[]; endpoint?: string } | undefined)?.keys ?? 
              ((oldConfig.panthera_blackbox?.telemetry as { enabled?: boolean; emit?: boolean; keys?: string[]; endpoint?: string } | undefined)?.endpoint 
                ? [((oldConfig.panthera_blackbox?.telemetry as { enabled?: boolean; emit?: boolean; keys?: string[]; endpoint?: string } | undefined)?.endpoint || '')]
                : []),
        // Preserve any other telemetry fields
        ...(oldConfig.panthera_blackbox?.telemetry || {}),
      },
      policy: {
        // Migrate old policy fields
        privacy_mode: (oldConfig.panthera_blackbox?.policy as { privacy_mode?: 'anon' | 'full' | 'minimal'; require_approval?: boolean; allow_rollback?: boolean; log_level?: 'basic' | 'detailed' | 'verbose' } | undefined)?.privacy_mode ?? 
                     ((oldConfig.panthera_blackbox?.policy as { privacy_mode?: 'anon' | 'full' | 'minimal'; require_approval?: boolean; allow_rollback?: boolean; log_level?: 'basic' | 'detailed' | 'verbose' } | undefined)?.require_approval 
                       ? 'full' 
                       : 'anon') as 'anon' | 'full' | 'minimal',
        log_level: (oldConfig.panthera_blackbox?.policy as { privacy_mode?: 'anon' | 'full' | 'minimal'; require_approval?: boolean; allow_rollback?: boolean; log_level?: 'basic' | 'detailed' | 'verbose' } | undefined)?.log_level ?? 
                  ((oldConfig.panthera_blackbox?.policy as { privacy_mode?: 'anon' | 'full' | 'minimal'; require_approval?: boolean; allow_rollback?: boolean; log_level?: 'basic' | 'detailed' | 'verbose' } | undefined)?.allow_rollback 
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
