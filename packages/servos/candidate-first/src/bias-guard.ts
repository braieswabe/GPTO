/**
 * Bias Guard - Detects and flags potential bias in job listings and candidate matching
 */

export interface BiasCheck {
  hasBias: boolean;
  flags: Array<{
    type: 'age' | 'gender' | 'race' | 'disability' | 'other';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
  }>;
}

/**
 * Check job listing for bias
 */
export function checkJobBias(jobListing: {
  title: string;
  requirements: string[];
  description?: string;
}): BiasCheck {
  const flags: BiasCheck['flags'] = [];
  const text = [
    jobListing.title,
    ...jobListing.requirements,
    jobListing.description || '',
  ].join(' ').toLowerCase();

  // Age discrimination
  if (/\b(age|years old|senior|junior|young|old)\b/i.test(text)) {
    flags.push({
      type: 'age',
      severity: 'high',
      message: 'Job listing may contain age-related language',
      suggestion: 'Remove age references and focus on skills and experience',
    });
  }

  // Gender bias
  const genderTerms = /\b(he|she|his|her|male|female|man|woman)\b/i;
  if (genderTerms.test(text)) {
    flags.push({
      type: 'gender',
      severity: 'medium',
      message: 'Job listing uses gendered language',
      suggestion: 'Use gender-neutral language (they/their)',
    });
  }

  // Disability discrimination
  if (/\b(able-bodied|healthy|no disabilities)\b/i.test(text)) {
    flags.push({
      type: 'disability',
      severity: 'high',
      message: 'Job listing may discriminate against people with disabilities',
      suggestion: 'Remove disability-related requirements unless essential for the role',
    });
  }

  return {
    hasBias: flags.length > 0,
    flags,
  };
}

/**
 * Check candidate matching for bias
 */
export function checkMatchingBias(fitScores: Array<{ score: number; factors: unknown }>): BiasCheck {
  const flags: BiasCheck['flags'] = [];

  // Check for systematic bias (e.g., all low scores for certain groups)
  // This is simplified - in production would check demographic data
  const avgScore = fitScores.reduce((sum, fs) => sum + fs.score, 0) / fitScores.length;
  
  if (avgScore < 0.3) {
    flags.push({
      type: 'other',
      severity: 'medium',
      message: 'Very low average match scores - may indicate overly restrictive requirements',
      suggestion: 'Review job requirements for unnecessary barriers',
    });
  }

  return {
    hasBias: flags.length > 0,
    flags,
  };
}
