import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { calculateFitScore, generateCandidateResponse, generateHirerInsights } from '@gpto/servos-candidate-first';

/**
 * POST /api/servos/candidate-first/match
 * 
 * Match candidates to jobs or jobs to candidates
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { action, candidate, job, candidates, jobs } = body;

    if (action === 'candidate_to_jobs' && candidate && jobs) {
      const response = generateCandidateResponse(candidate, jobs);
      return NextResponse.json({
        success: true,
        response,
      });
    }

    if (action === 'job_to_candidates' && job && candidates) {
      const insights = generateHirerInsights(job, candidates);
      return NextResponse.json({
        success: true,
        insights,
      });
    }

    if (action === 'calculate_fit' && candidate && job) {
      const fitScore = calculateFitScore(candidate, job);
      return NextResponse.json({
        success: true,
        fitScore,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error matching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to match candidates' },
      { status: 500 }
    );
  }
}
