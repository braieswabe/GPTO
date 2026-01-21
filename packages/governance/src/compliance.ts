/**
 * Compliance micro-engine
 * Legal region checks, consent management, data retention
 */

export type LegalRegion = 'US' | 'EU' | 'CA' | 'UK';

export interface ComplianceCheck {
  region: LegalRegion;
  compliant: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Check compliance for a region
 */
export function checkRegionCompliance(
  region: LegalRegion,
  data: {
    collectsPII?: boolean;
    storesData?: boolean;
    sharesData?: boolean;
    hasConsent?: boolean;
  }
): ComplianceCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  switch (region) {
    case 'EU':
      // GDPR checks
      if (data.collectsPII && !data.hasConsent) {
        issues.push('GDPR: Consent required for PII collection');
        recommendations.push('Implement consent mechanism');
      }
      if (data.storesData) {
        recommendations.push('GDPR: Ensure data retention policy is documented');
      }
      break;

    case 'CA':
      // CCPA checks
      if (data.collectsPII) {
        recommendations.push('CCPA: Provide opt-out mechanism');
      }
      break;

    case 'US':
      // EEOC checks
      recommendations.push('EEOC: Ensure no discriminatory language');
      break;
  }

  return {
    region,
    compliant: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Check data retention compliance
 */
export function checkDataRetention(
  region: LegalRegion,
  dataAge: number // days
): { compliant: boolean; action?: string } {
  const maxRetention: Record<LegalRegion, number> = {
    EU: 365, // GDPR: reasonable retention period
    CA: 365, // CCPA: similar
    US: 730, // More lenient
    UK: 365, // Similar to EU post-Brexit
  };

  const maxDays = maxRetention[region] || 365;

  if (dataAge > maxDays) {
    return {
      compliant: false,
      action: `Data older than ${maxDays} days should be deleted per ${region} regulations`,
    };
  }

  return { compliant: true };
}
