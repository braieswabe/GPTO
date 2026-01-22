import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { eq, desc } from 'drizzle-orm';
import { callLLM } from '@gpto/api-lattice';
import type { LLMProvider } from '@gpto/api-lattice';

export interface TechnicalAuditResult {
  schema: {
    present: boolean;
    types: string[];
    issues: string[];
  };
  performance: {
    score: number;
    issues: string[];
  };
  seo: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  accessibility: {
    score: number;
    issues: string[];
  };
  security: {
    score: number;
    issues: string[];
  };
}

export interface TechnicalAuditRecommendations {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
}

/**
 * Run technical audit for a site
 */
export async function runTechnicalAudit(siteId: string): Promise<TechnicalAuditResult> {
  // Get site and current config
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  
  if (!site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  // Get active config
  const [activeConfig] = await db
    .select()
    .from(configVersions)
    .where(eq(configVersions.siteId, siteId))
    .where(eq(configVersions.isActive, true))
    .orderBy(desc(configVersions.createdAt))
    .limit(1);

  const config = activeConfig?.configJson as Record<string, unknown> | undefined;

  // Check schema
  const schemaCheck = checkSchema(config);
  
  // Fetch site HTML for analysis
  const siteUrl = `https://${site.domain}`;
  let htmlContent = '';
  try {
    const response = await fetch(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTOBot/1.0)',
      },
    });
    htmlContent = await response.text();
  } catch (error) {
    console.error(`Error fetching ${siteUrl}:`, error);
  }

  // Analyze performance
  const performanceCheck = analyzePerformance(htmlContent);
  
  // Analyze SEO
  const seoCheck = analyzeSEO(htmlContent, config);
  
  // Analyze accessibility
  const accessibilityCheck = analyzeAccessibility(htmlContent);
  
  // Analyze security
  const securityCheck = analyzeSecurity(htmlContent, siteUrl);

  return {
    schema: schemaCheck,
    performance: performanceCheck,
    seo: seoCheck,
    accessibility: accessibilityCheck,
    security: securityCheck,
  };
}

/**
 * Check schema implementation
 */
function checkSchema(config: Record<string, unknown> | undefined): {
  present: boolean;
  types: string[];
  issues: string[];
} {
  const issues: string[] = [];
  const types: string[] = [];

  if (!config) {
    return {
      present: false,
      types: [],
      issues: ['No configuration found'],
    };
  }

  const blackbox = config.panthera_blackbox as Record<string, unknown> | undefined;
  
  if (!blackbox) {
    issues.push('Panthera Black Box not configured');
    return { present: false, types: [], issues };
  }

  // Check if schema injection is enabled (would be in runtime)
  // For now, check if authority_grove is configured
  const authorityGrove = blackbox.authority_grove as Record<string, unknown> | undefined;
  
  if (authorityGrove) {
    types.push('Organization');
  } else {
    issues.push('Organization schema not configured');
  }

  return {
    present: types.length > 0,
    types,
    issues,
  };
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(html: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check HTML size
  const sizeKB = new Blob([html]).size / 1024;
  if (sizeKB > 200) {
    issues.push(`Large HTML size: ${sizeKB.toFixed(0)}KB (recommend <200KB)`);
    score -= 10;
  }

  // Check for inline styles (performance issue)
  const inlineStyleMatches = html.match(/style\s*=/g);
  if (inlineStyleMatches && inlineStyleMatches.length > 10) {
    issues.push(`Many inline styles detected: ${inlineStyleMatches.length} (consider external CSS)`);
    score -= 5;
  }

  // Check for external scripts
  const scriptMatches = html.match(/<script[^>]*src=/g);
  if (scriptMatches && scriptMatches.length > 10) {
    issues.push(`Many external scripts: ${scriptMatches.length} (consider bundling)`);
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Analyze SEO factors
 */
function analyzeSEO(html: string, config: Record<string, unknown> | undefined): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for title tag
  if (!html.includes('<title>')) {
    issues.push('Missing <title> tag');
    score -= 20;
  } else {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const titleLength = titleMatch[1].length;
      if (titleLength < 30) {
        issues.push(`Title too short: ${titleLength} characters (recommend 30-60)`);
        score -= 5;
      } else if (titleLength > 60) {
        issues.push(`Title too long: ${titleLength} characters (recommend 30-60)`);
        score -= 5;
      }
    }
  }

  // Check for meta description
  if (!html.includes('meta name="description"')) {
    issues.push('Missing meta description');
    score -= 15;
    recommendations.push('Add meta description tag');
  }

  // Check for h1 tag
  if (!html.match(/<h1[^>]*>/i)) {
    issues.push('Missing H1 heading');
    score -= 10;
    recommendations.push('Add H1 heading to main content');
  }

  // Check for alt attributes on images
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt='));
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} image(s) missing alt attributes`);
      score -= 5;
      recommendations.push('Add alt attributes to all images');
    }
  }

  // Check for JSON-LD schema
  if (!html.includes('application/ld+json')) {
    issues.push('No JSON-LD schema detected');
    score -= 10;
    recommendations.push('Add JSON-LD structured data');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze accessibility
 */
function analyzeAccessibility(html: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for lang attribute
  if (!html.match(/<html[^>]*lang=/i)) {
    issues.push('Missing lang attribute on <html> tag');
    score -= 5;
  }

  // Check for alt attributes (already checked in SEO, but important for accessibility)
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt='));
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} image(s) missing alt attributes`);
      score -= 10;
    }
  }

  // Check for form labels
  const inputMatches = html.match(/<input[^>]*>/gi);
  if (inputMatches) {
    // Simple check - would need more sophisticated analysis
    const inputsWithoutLabel = inputMatches.filter(input => {
      const idMatch = input.match(/id="([^"]+)"/);
      if (!idMatch) return true;
      const id = idMatch[1];
      return !html.includes(`<label[^>]*for="${id}"`);
    });
    if (inputsWithoutLabel.length > 0) {
      issues.push(`${inputsWithoutLabel.length} form input(s) may be missing labels`);
      score -= 5;
    }
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Analyze security
 */
function analyzeSecurity(html: string, url: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for HTTPS
  if (!url.startsWith('https://')) {
    issues.push('Site not using HTTPS');
    score -= 30;
  }

  // Check for inline scripts (XSS risk)
  const inlineScriptMatches = html.match(/<script[^>]*>(?!.*src=)[^<]*<\/script>/gi);
  if (inlineScriptMatches && inlineScriptMatches.length > 0) {
    issues.push(`${inlineScriptMatches.length} inline script(s) detected (consider external scripts)`);
    score -= 5;
  }

  // Check for Content Security Policy meta tag
  if (!html.includes('Content-Security-Policy')) {
    issues.push('No Content-Security-Policy header detected');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Generate AI-powered recommendations from audit results
 */
export async function generateRecommendations(
  auditResults: TechnicalAuditResult
): Promise<TechnicalAuditRecommendations> {
  // In production, would use LLM to generate contextual recommendations
  // For now, use rule-based categorization

  const critical: string[] = [];
  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  // Categorize issues by severity
  if (auditResults.security.score < 70) {
    critical.push('Security issues detected - address immediately');
  }
  if (auditResults.seo.score < 50) {
    critical.push('Critical SEO issues - significant impact on search visibility');
  }

  auditResults.seo.issues.forEach(issue => {
    if (issue.includes('Missing')) {
      high.push(issue);
    } else {
      medium.push(issue);
    }
  });

  auditResults.performance.issues.forEach(issue => {
    medium.push(issue);
  });

  auditResults.accessibility.issues.forEach(issue => {
    medium.push(issue);
  });

  auditResults.schema.issues.forEach(issue => {
    low.push(issue);
  });

  return {
    critical,
    high,
    medium,
    low,
  };
}
