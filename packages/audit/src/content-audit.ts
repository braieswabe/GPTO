import { db } from '@gpto/database';
import { sites } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { callLLM } from '@gpto/api-lattice';
import type { LLMProvider } from '@gpto/api-lattice';

export interface ContentReview {
  page: string;
  headline: {
    text: string;
    score: number;
    issues: string[];
    recommendations: string[];
  };
  paragraphs: Array<{
    text: string;
    score: number;
    issues: string[];
  }>;
  overallScore: number;
}

export interface ContentAuditResult {
  reviews: ContentReview[];
  summary: {
    averageScore: number;
    totalIssues: number;
    recommendations: string[];
  };
}

/**
 * Review content for a site (headline + 3 paragraphs)
 */
export async function reviewContent(siteId: string, pages?: string[]): Promise<ContentAuditResult> {
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  
  if (!site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  const siteUrl = `https://${site.domain}`;
  const pagesToReview = pages || [siteUrl]; // Default to homepage

  const reviews: ContentReview[] = [];

  for (const pageUrl of pagesToReview) {
    try {
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GPTOBot/1.0)',
        },
      });
      
      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const review = analyzePageContent(html, pageUrl);
      reviews.push(review);
    } catch (error) {
      console.error(`Error reviewing ${pageUrl}:`, error);
    }
  }

  // Calculate summary
  const scores = reviews.map(r => r.overallScore);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const totalIssues = reviews.reduce((sum, r) => {
    return sum + r.headline.issues.length + r.paragraphs.reduce((pSum, p) => pSum + p.issues.length, 0);
  }, 0);

  const recommendations = reviews
    .flatMap(r => r.headline.recommendations)
    .filter((r, i, arr) => arr.indexOf(r) === i); // Deduplicate

  return {
    reviews,
    summary: {
      averageScore,
      totalIssues,
      recommendations,
    },
  };
}

/**
 * Analyze page content
 */
function analyzePageContent(html: string, pageUrl: string): ContentReview {
  // Extract headline (h1)
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const headlineText = h1Match ? h1Match[1].trim() : '';

  // Extract first 3 paragraphs
  const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
  const paragraphs = (pMatches || []).slice(0, 3).map(match => {
    const textMatch = match.match(/<p[^>]*>([^<]+)<\/p>/i);
    return textMatch ? textMatch[1].trim() : '';
  }).filter(text => text.length > 0);

  // Analyze headline
  const headlineAnalysis = analyzeHeadline(headlineText);

  // Analyze paragraphs
  const paragraphAnalyses = paragraphs.map(p => analyzeParagraph(p));

  // Calculate overall score
  const headlineScore = headlineAnalysis.score;
  const paragraphScores = paragraphAnalyses.map(p => p.score);
  const overallScore = paragraphScores.length > 0
    ? (headlineScore + paragraphScores.reduce((a, b) => a + b, 0)) / (1 + paragraphScores.length)
    : headlineScore;

  return {
    page: pageUrl,
    headline: headlineAnalysis,
    paragraphs: paragraphAnalyses,
    overallScore,
  };
}

/**
 * Analyze headline
 */
function analyzeHeadline(text: string): {
  text: string;
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!text) {
    issues.push('No headline found');
    return { text: '', score: 0, issues, recommendations };
  }

  // Check length
  if (text.length < 20) {
    issues.push(`Headline too short: ${text.length} characters`);
    score -= 20;
    recommendations.push('Headlines should be 20-60 characters for optimal AI search visibility');
  } else if (text.length > 60) {
    issues.push(`Headline too long: ${text.length} characters`);
    score -= 10;
    recommendations.push('Consider shortening headline to under 60 characters');
  }

  // Check for keywords (simple check)
  if (text.split(/\s+/).length < 3) {
    issues.push('Headline may be too brief');
    score -= 5;
  }

  // Check for power words (simplified)
  const powerWords = ['best', 'guide', 'ultimate', 'complete', 'essential'];
  const hasPowerWord = powerWords.some(word => text.toLowerCase().includes(word));
  if (!hasPowerWord && text.length > 30) {
    recommendations.push('Consider adding power words to increase engagement');
  }

  return {
    text,
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze paragraph
 */
function analyzeParagraph(text: string): {
  text: string;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  if (!text) {
    return { text: '', score: 0, issues };
  }

  // Check length
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) {
    issues.push(`Paragraph too short: ${wordCount} words`);
    score -= 15;
  } else if (wordCount > 150) {
    issues.push(`Paragraph too long: ${wordCount} words (consider breaking into smaller paragraphs)`);
    score -= 10;
  }

  // Check readability (simple - average sentence length)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    if (avgSentenceLength > 20) {
      issues.push(`Average sentence length too long: ${avgSentenceLength.toFixed(1)} words`);
      score -= 5;
    }
  }

  return {
    text: text.substring(0, 200), // Truncate for display
    score: Math.max(0, score),
    issues,
  };
}
