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
  seo?: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  aiSearchOptimization: {
    score: number;
    issues: string[];
    recommendations: string[];
    metrics: {
      schemaQuality: number;
      authoritySignals: number;
      structuredDataCompleteness: number;
      factualAccuracy: number;
    };
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
  
  // Analyze AI Search Optimization
  const aiSearchCheck = analyzeAISearchOptimization(htmlContent, config);
  
  // Analyze accessibility
  const accessibilityCheck = analyzeAccessibility(htmlContent);
  
  // Analyze security
  const securityCheck = analyzeSecurity(htmlContent, siteUrl);

  return {
    schema: schemaCheck,
    performance: performanceCheck,
    aiSearchOptimization: aiSearchCheck,
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
 * Analyze AI Search Optimization factors
 * Focuses on structured data, authority signals, and AI model comprehension
 */
function analyzeAISearchOptimization(html: string, config: Record<string, unknown> | undefined): {
  score: number;
  issues: string[];
  recommendations: string[];
  metrics: {
    schemaQuality: number;
    authoritySignals: number;
    structuredDataCompleteness: number;
    factualAccuracy: number;
  };
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  
  const metrics = {
    schemaQuality: 0,
    authoritySignals: 0,
    structuredDataCompleteness: 0,
    factualAccuracy: 0,
  };

  // 1. JSON-LD Schema Quality (30 points - critical for AI models)
  const schemaQualityScore = analyzeSchemaQuality(html, config);
  metrics.schemaQuality = schemaQualityScore.score;
  score += schemaQualityScore.score;
  issues.push(...schemaQualityScore.issues);
  recommendations.push(...schemaQualityScore.recommendations);

  // 2. Authority Signals (25 points - AI models prioritize authoritative sources)
  const authorityScore = analyzeAuthoritySignals(html, config);
  metrics.authoritySignals = authorityScore.score;
  score += authorityScore.score;
  issues.push(...authorityScore.issues);
  recommendations.push(...authorityScore.recommendations);

  // 3. Structured Data Completeness (20 points)
  const structuredDataScore = analyzeStructuredDataCompleteness(html, config);
  metrics.structuredDataCompleteness = structuredDataScore.score;
  score += structuredDataScore.score;
  issues.push(...structuredDataScore.issues);
  recommendations.push(...structuredDataScore.recommendations);

  // 4. Factual Accuracy Indicators (15 points)
  const factualAccuracyScore = analyzeFactualAccuracy(html);
  metrics.factualAccuracy = factualAccuracyScore.score;
  score += factualAccuracyScore.score;
  issues.push(...factualAccuracyScore.issues);
  recommendations.push(...factualAccuracyScore.recommendations);

  // 5. Traditional Elements (10 points - still useful but less critical)
  const traditionalScore = analyzeTraditionalElements(html);
  score += traditionalScore.score;
  issues.push(...traditionalScore.issues);
  recommendations.push(...traditionalScore.recommendations);

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
    metrics,
  };
}

/**
 * Analyze JSON-LD Schema Quality
 */
function analyzeSchemaQuality(html: string, config: Record<string, unknown> | undefined): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Check for JSON-LD schema presence
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatches || jsonLdMatches.length === 0) {
    issues.push('No JSON-LD schema detected');
    recommendations.push('Add JSON-LD structured data with Schema.org context');
    return { score: 0, issues, recommendations };
  }

  score += 10; // Base score for having JSON-LD

  // Check for valid Schema.org context
  let hasValidContext = false;
  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
      if (jsonContent) {
        const parsed = JSON.parse(jsonContent);
        if (parsed['@context'] === 'https://schema.org' || parsed['@context']?.includes('schema.org')) {
          hasValidContext = true;
          score += 10;
          break;
        }
      }
    } catch (e) {
      // Invalid JSON
    }
  }

  if (!hasValidContext) {
    issues.push('JSON-LD schema missing valid Schema.org context');
    recommendations.push('Ensure JSON-LD schemas use @context: "https://schema.org"');
  }

  // Check for schema types (Organization, Product, Service, FAQ, etc.)
  const schemaTypes: string[] = [];
  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
      if (jsonContent) {
        const parsed = JSON.parse(jsonContent);
        if (parsed['@type']) {
          const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
          schemaTypes.push(...types);
        }
      }
    } catch (e) {
      // Invalid JSON
    }
  }

  if (schemaTypes.length === 0) {
    issues.push('JSON-LD schemas missing @type declarations');
    recommendations.push('Add @type to JSON-LD schemas (e.g., Organization, Product, Service)');
  } else {
    score += 5;
    if (schemaTypes.includes('Organization')) {
      score += 5;
    } else {
      issues.push('Organization schema not found');
      recommendations.push('Add Organization schema for better AI recognition');
    }
  }

  return {
    score: Math.min(30, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze Authority Signals
 */
function analyzeAuthoritySignals(html: string, config: Record<string, unknown> | undefined): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Check for sameAs links in schemas (social media, partner links)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let hasSameAs = false;
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
        if (jsonContent) {
          const parsed = JSON.parse(jsonContent);
          if (parsed.sameAs && Array.isArray(parsed.sameAs) && parsed.sameAs.length > 0) {
            hasSameAs = true;
            score += 10;
            break;
          }
        }
      } catch (e) {
        // Invalid JSON
      }
    }
  }

  if (!hasSameAs) {
    issues.push('No sameAs links found in schemas');
    recommendations.push('Add sameAs property to Organization schema with social media and partner links');
  }

  // Check Authority Grove configuration
  const blackbox = config?.panthera_blackbox as Record<string, unknown> | undefined;
  const authorityGrove = blackbox?.authority_grove as Record<string, unknown> | undefined;
  
  if (authorityGrove) {
    score += 10;
    const keywords = authorityGrove.keywords as string[] | undefined;
    const verticals = authorityGrove.verticals as string[] | undefined;
    
    if (keywords && keywords.length > 0) {
      score += 3;
    } else {
      issues.push('Authority Grove keywords not configured');
      recommendations.push('Configure keywords in Authority Grove for better AI recognition');
    }
    
    if (verticals && verticals.length > 0) {
      score += 2;
    } else {
      issues.push('Authority Grove verticals not configured');
      recommendations.push('Configure verticals in Authority Grove');
    }
  } else {
    issues.push('Authority Grove not configured');
    recommendations.push('Set up Authority Grove configuration for authority signals');
  }

  return {
    score: Math.min(25, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze Structured Data Completeness
 */
function analyzeStructuredDataCompleteness(html: string, config: Record<string, unknown> | undefined): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Check for Organization schema
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let hasOrganization = false;
  let hasProductOrService = false;
  let hasFAQ = false;

  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
        if (jsonContent) {
          const parsed = JSON.parse(jsonContent);
          const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
          
          if (types.includes('Organization')) {
            hasOrganization = true;
            score += 10;
          }
          if (types.includes('Product') || types.includes('Service')) {
            hasProductOrService = true;
            score += 5;
          }
          if (types.includes('FAQPage') || types.includes('Question')) {
            hasFAQ = true;
            score += 5;
          }
        }
      } catch (e) {
        // Invalid JSON
      }
    }
  }

  if (!hasOrganization) {
    issues.push('Organization schema not found');
    recommendations.push('Add Organization schema for basic AI recognition');
  }

  // Check tier-appropriate schemas (would need tier info from config)
  const blackbox = config?.panthera_blackbox as Record<string, unknown> | undefined;
  const tier = blackbox?.tier as string | undefined;
  
  if (tier === 'silver' || tier === 'gold') {
    if (!hasProductOrService) {
      issues.push('Product or Service schema recommended for Silver/Gold tiers');
      recommendations.push('Add Product or Service schema for enhanced AI visibility');
    }
  }

  return {
    score: Math.min(20, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze Factual Accuracy Indicators
 */
function analyzeFactualAccuracy(html: string): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Check for clear, descriptive content
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1].trim().length > 0) {
    score += 5;
  } else {
    issues.push('Missing or empty H1 heading');
    recommendations.push('Add clear H1 heading for better AI comprehension');
  }

  // Check semantic structure
  const h2Matches = html.match(/<h2[^>]*>/gi);
  if (h2Matches && h2Matches.length >= 2) {
    score += 5;
  } else {
    issues.push('Insufficient heading structure (H2+)');
    recommendations.push('Add semantic heading structure (H2, H3) for better content organization');
  }

  // Check for descriptive paragraphs
  const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (pMatches && pMatches.length >= 3) {
    score += 5;
  } else {
    issues.push('Insufficient descriptive content');
    recommendations.push('Add more descriptive content paragraphs for AI models to understand context');
  }

  return {
    score: Math.min(15, score),
    issues,
    recommendations,
  };
}

/**
 * Analyze Traditional Elements (still useful but less critical)
 */
function analyzeTraditionalElements(html: string): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Check for title tag (5 points)
  if (html.includes('<title>')) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim().length >= 30 && titleMatch[1].trim().length <= 60) {
      score += 5;
    } else {
      issues.push('Title tag length not optimal (recommend 30-60 characters)');
      recommendations.push('Optimize title tag length for better AI comprehension');
    }
  } else {
    issues.push('Missing <title> tag');
    recommendations.push('Add descriptive <title> tag');
  }

  // Check for meta description (5 points)
  if (html.includes('meta name="description"')) {
    score += 5;
  } else {
    issues.push('Missing meta description');
    recommendations.push('Add meta description tag');
  }

  return {
    score: Math.min(10, score),
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
  if (auditResults.aiSearchOptimization.score < 50) {
    critical.push('Critical AI Search Optimization issues - significant impact on AI search visibility');
  }

  auditResults.aiSearchOptimization.issues.forEach(issue => {
    if (issue.includes('Missing') || issue.includes('not found') || issue.includes('not configured')) {
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
