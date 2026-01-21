/**
 * Candidate-First Servo
 */

export interface CandidateProfile {
  id: string;
  skills: string[];
  experience: number;
  location?: string;
  preferences?: {
    roleType?: string;
    schedule?: string;
    compensation?: string;
  };
  cognitiveFingerprint?: {
    focus: number;
    risk: number;
    verbosity: number;
  };
}

export interface JobListing {
  id: string;
  title: string;
  requirements: string[];
  location?: string;
  compensation?: string;
}

export interface FitScore {
  candidateId: string;
  jobId: string;
  score: number; // 0-1
  factors: {
    skillMatch: number;
    experienceMatch: number;
    locationMatch: number;
    preferenceMatch: number;
  };
  biasFlags: string[];
}

/**
 * Calculate fit score between candidate and job
 */
export function calculateFitScore(
  candidate: CandidateProfile,
  job: JobListing
): FitScore {
  // Skill matching
  const candidateSkills = new Set(candidate.skills.map((s) => s.toLowerCase()));
  const jobRequirements = job.requirements.map((r) => r.toLowerCase());
  const matchingSkills = jobRequirements.filter((req) =>
    Array.from(candidateSkills).some((skill) => skill.includes(req) || req.includes(skill))
  );
  const skillMatch = jobRequirements.length > 0 
    ? matchingSkills.length / jobRequirements.length 
    : 0.5;

  // Experience matching (simplified)
  const experienceMatch = Math.min(1.0, candidate.experience / 5); // Normalize to 5 years

  // Location matching
  const locationMatch = candidate.location && job.location
    ? candidate.location.toLowerCase() === job.location.toLowerCase() ? 1.0 : 0.5
    : 0.7; // Neutral if not specified

  // Preference matching
  const preferenceMatch = candidate.preferences?.roleType 
    ? 0.8 // Would check against job type in production
    : 0.5;

  // Overall score (weighted average)
  const score = (
    skillMatch * 0.4 +
    experienceMatch * 0.3 +
    locationMatch * 0.15 +
    preferenceMatch * 0.15
  );

  // Bias detection
  const biasFlags: string[] = [];
  // Check for age discrimination
  if (job.requirements.some((r) => /age|years old|senior|junior/i.test(r))) {
    biasFlags.push('Potential age discrimination in requirements');
  }

  return {
    candidateId: candidate.id,
    jobId: job.id,
    score,
    factors: {
      skillMatch,
      experienceMatch,
      locationMatch,
      preferenceMatch,
    },
    biasFlags,
  };
}

/**
 * Generate candidate-facing response
 */
export function generateCandidateResponse(
  candidate: CandidateProfile,
  jobs: JobListing[]
): string {
  const fitScores = jobs.map((job) => calculateFitScore(candidate, job));
  const topMatches = fitScores
    .filter((fs) => fs.score > 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (topMatches.length === 0) {
    return "I couldn't find any strong matches for your profile. Let me know if you'd like to refine your search criteria.";
  }

  return `I found ${topMatches.length} great matches for you:\n\n${topMatches
    .map(
      (fs, i) =>
        `${i + 1}. ${jobs.find((j) => j.id === fs.jobId)?.title} (${(fs.score * 100).toFixed(0)}% match)`
    )
    .join('\n')}`;
}

/**
 * Generate hirer-facing insights
 */
export function generateHirerInsights(
  job: JobListing,
  candidates: CandidateProfile[]
): {
  topCandidates: Array<FitScore & { candidate: CandidateProfile }>;
  recommendations: string[];
} {
  const fitScores = candidates.map((c) => ({
    ...calculateFitScore(c, job),
    candidate: c,
  }));

  const topCandidates = fitScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const recommendations: string[] = [];
  
  if (topCandidates.length === 0) {
    recommendations.push('No strong matches found. Consider broadening requirements.');
  } else {
    recommendations.push(`Found ${topCandidates.length} qualified candidates`);
  }

  // Check for bias flags
  const biasCount = fitScores.reduce((sum, fs) => sum + fs.biasFlags.length, 0);
  if (biasCount > 0) {
    recommendations.push('⚠️ Review job requirements for potential bias');
  }

  return {
    topCandidates,
    recommendations,
  };
}
