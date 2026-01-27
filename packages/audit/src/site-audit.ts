import { db } from '@gpto/database';
import { sites } from '@gpto/database/src/schema';
import { eq } from 'drizzle-orm';
import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import type { StructuredRecommendations } from './recommendations';

export interface SiteAuditScope {
  maxPages: number;
  scannedPages: number;
  usedSitemap: boolean;
  durationMs: number;
}

export interface SiteAuditScores {
  aiReadiness: number;
  structure: number;
  contentDepth: number;
  technicalReadiness: number;
  overall: number;
}

export interface SiteAuditGrades {
  aiReadiness: string;
  structure: string;
  contentDepth: string;
  technicalReadiness: string;
  overall: string;
}

export interface SiteAuditSignals {
  titleRate: number;
  h1Rate: number;
  metaRate: number;
  avgText: number;
  avgH2: number;
  jsonLdRate: number;
  canonicalRate: number;
  errorRate: number;
  answerability: {
    whatRate: number;
    whoRate: number;
    howRate: number;
    trustRate: number;
  };
  usedSitemap: boolean;
}

export interface SiteAuditExplanations {
  tierWhy: string[];
  perCategory: {
    aiReadiness: CategoryExplanation;
    structure: CategoryExplanation;
    contentDepth: CategoryExplanation;
    technicalReadiness: CategoryExplanation;
  };
}

export interface SiteAuditResult {
  url: string;
  scope: SiteAuditScope;
  scores: SiteAuditScores;
  grades: SiteAuditGrades;
  tier: 'Gold' | 'Silver' | 'Bronze';
  explanations: SiteAuditExplanations;
  recommendations: StructuredRecommendations[];
  signals: SiteAuditSignals;
}

interface CategoryExplanation {
  strengths: string[];
  gaps: string[];
  improvements: string[];
}

interface PageSummary {
  url: string;
  status: number;
  title: string;
  metaDescription: boolean;
  canonical: boolean;
  h1Count: number;
  h2Count: number;
  hasJsonLd: boolean;
  text: string;
}

interface CrawlResult {
  pages: PageSummary[];
  usedSitemap: boolean;
  durationMs: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PAGES = 20;
const MAX_DEPTH = 2;
const PAGE_TIMEOUT_MS = 6000;
const TOTAL_TIMEOUT_MS = 20000;

const WHAT_KEYWORDS = ['we help', 'we provide', 'our product', 'our service', 'platform', 'solution'];
const WHO_KEYWORDS = ['for teams', 'for businesses', 'for companies', 'for marketers', 'for recruiters', 'for enterprises'];
const HOW_KEYWORDS = ['how it works', 'get started', 'features', 'pricing', 'plans', 'documentation', 'api'];
const TRUST_KEYWORDS = ['case study', 'testimonials', 'trusted by', 'security', 'privacy', 'compliance', 'terms', 'gdpr', 'soc 2'];

const cacheKey = '__gpto_site_audit_cache__';

export async function runSiteAudit(siteId: string): Promise<SiteAuditResult> {
  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  const url = normalizeInputUrl(site.domain);
  return await auditSite(url);
}

export async function auditSite(urlInput: string): Promise<SiteAuditResult> {
  const url = normalizeInputUrl(urlInput);
  const origin = new URL(url).origin;
  const cache = getCache();
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.payload as SiteAuditResult;
  }

  const startTime = Date.now();
  const crawl = await crawlSite(url, origin);

  const pages = crawl.pages;
  const signals = computeSignals(pages, crawl.usedSitemap);
  const scores = computeScores(pages, url, origin, signals);
  const grades = computeGrades(scores);
  const tier = computeTier(grades);
  const explanations = buildExplanations(pages, signals, scores, grades, tier);
  const recommendations = buildRecommendations(signals);

  const result: SiteAuditResult = {
    url: origin,
    scope: {
      maxPages: MAX_PAGES,
      scannedPages: pages.length,
      usedSitemap: crawl.usedSitemap,
      durationMs: crawl.durationMs,
    },
    scores,
    grades,
    tier,
    explanations,
    recommendations,
    signals,
  };

  cache.set(origin, { ts: Date.now(), payload: result });
  return result;
}

function getCache(): Map<string, { ts: number; payload: SiteAuditResult }> {
  const globalScope = globalThis as typeof globalThis & {
    __gpto_site_audit_cache__?: Map<string, { ts: number; payload: SiteAuditResult }>;
  };
  if (!globalScope[cacheKey]) {
    globalScope[cacheKey] = new Map();
  }
  return globalScope[cacheKey] as Map<string, { ts: number; payload: SiteAuditResult }>;
}

function normalizeInputUrl(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

async function crawlSite(seedUrl: string, origin: string): Promise<CrawlResult> {
  const startTime = Date.now();
  const sitemapResult = await crawlFromSitemap(origin, seedUrl, startTime);
  if (sitemapResult) {
    return sitemapResult;
  }
  return await crawlFromLinks(seedUrl, origin, startTime);
}

async function crawlFromSitemap(origin: string, seedUrl: string, startTime: number): Promise<CrawlResult | null> {
  const sitemapUrl = `${origin}/sitemap.xml`;
  try {
    const response = await fetchWithTimeout(sitemapUrl, PAGE_TIMEOUT_MS);
    if (!response || response.status >= 400 || !response.html) {
      return null;
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(response.html);
    const urls = extractSitemapUrls(parsed, origin);
    if (urls.length === 0) {
      return null;
    }

    const pages: PageSummary[] = [];
    for (const url of urls.slice(0, MAX_PAGES)) {
      if (Date.now() - startTime > TOTAL_TIMEOUT_MS) {
        break;
      }
      const summary = await fetchPageSummary(url);
      pages.push(summary);
    }

    return {
      pages,
      usedSitemap: true,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return null;
  }
}

async function crawlFromLinks(seedUrl: string, origin: string, startTime: number): Promise<CrawlResult> {
  const queue: Array<{ url: string; depth: number }> = [{ url: seedUrl, depth: 0 }];
  const visited = new Set<string>();
  const pages: PageSummary[] = [];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    if (Date.now() - startTime > TOTAL_TIMEOUT_MS) {
      break;
    }

    const current = queue.shift();
    if (!current) break;
    if (visited.has(current.url)) continue;
    visited.add(current.url);

    const response = await fetchWithTimeout(current.url, PAGE_TIMEOUT_MS);
    const summary = summarizePage(current.url, response);
    pages.push(summary);

    if (current.depth >= MAX_DEPTH || !response?.html) {
      continue;
    }

    const links = extractInternalLinks(response.html, current.url, origin);
    const nextDepth = current.depth + 1;
    const newLinks = links.filter(link => !visited.has(link) && !queue.some(item => item.url === link));

    newLinks.forEach(link => {
      queue.push({ url: link, depth: nextDepth });
    });

    queue.sort((a, b) => a.url.localeCompare(b.url));
  }

  return {
    pages,
    usedSitemap: false,
    durationMs: Date.now() - startTime,
  };
}

function extractSitemapUrls(parsed: unknown, origin: string): string[] {
  const urls: string[] = [];
  if (!parsed || typeof parsed !== 'object') return urls;

  const root = parsed as Record<string, unknown>;
  const urlset = root.urlset as Record<string, unknown> | undefined;
  const urlEntries = urlset?.url;

  const entries = Array.isArray(urlEntries) ? urlEntries : urlEntries ? [urlEntries] : [];
  entries.forEach(entry => {
    if (!entry || typeof entry !== 'object') return;
    const loc = (entry as Record<string, unknown>).loc;
    if (typeof loc !== 'string') return;
    try {
      const normalized = new URL(loc);
      if (normalized.origin === origin) {
        urls.push(normalized.toString());
      }
    } catch (error) {
      return;
    }
  });

  return urls.sort((a, b) => a.localeCompare(b));
}

function extractInternalLinks(html: string, baseUrl: string, origin: string): string[] {
  const $ = load(html);
  const links: string[] = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin !== origin) return;
      resolved.hash = '';
      links.push(resolved.toString());
    } catch (error) {
      return;
    }
  });

  const unique = Array.from(new Set(links));
  return unique.sort((a, b) => a.localeCompare(b));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<{ status: number; html: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GPTO-AuditBot/0.1',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    const html = await response.text();
    return { status: response.status, html };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageSummary(url: string): Promise<PageSummary> {
  const response = await fetchWithTimeout(url, PAGE_TIMEOUT_MS);
  return summarizePage(url, response);
}

function summarizePage(url: string, response: { status: number; html: string } | null): PageSummary {
  const status = response?.status ?? 0;
  const html = response?.html ?? '';

  const $ = load(html);
  $('script, style, noscript').remove();

  const title = ($('title').first().text() || '').trim();
  const metaDescription = $('meta[name="description"], meta[name="Description"]').length > 0;
  const canonical = $('link[rel="canonical"]').length > 0;
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
  const bodyText = normalizeWhitespace($('body').text());
  const text = bodyText.slice(0, 20000);

  return {
    url,
    status,
    title,
    metaDescription,
    canonical,
    h1Count,
    h2Count,
    hasJsonLd,
    text,
  };
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function computeSignals(pages: PageSummary[], usedSitemap: boolean): SiteAuditSignals {
  const total = pages.length || 1;
  const titleRate = pages.filter(page => page.title.trim().length > 2).length / total;
  const h1Rate = pages.filter(page => page.h1Count >= 1).length / total;
  const metaRate = pages.filter(page => page.metaDescription).length / total;
  const avgText = pages.reduce((sum, page) => sum + page.text.length, 0) / total;
  const avgH2 = pages.reduce((sum, page) => sum + page.h2Count, 0) / total;
  const jsonLdRate = pages.filter(page => page.hasJsonLd).length / total;
  const canonicalRate = pages.filter(page => page.canonical).length / total;
  const errorRate = pages.filter(page => page.status === 0 || page.status >= 400).length / total;

  const answerability = computeAnswerabilityRates(pages);

  return {
    titleRate,
    h1Rate,
    metaRate,
    avgText,
    avgH2,
    jsonLdRate,
    canonicalRate,
    errorRate,
    answerability,
    usedSitemap,
  };
}

function computeAnswerabilityRates(pages: PageSummary[]): SiteAuditSignals['answerability'] {
  const pagesOk = pages.filter(page => page.status > 0 && page.status < 400);
  const total = pagesOk.length || 1;

  let whatCount = 0;
  let whoCount = 0;
  let howCount = 0;
  let trustCount = 0;

  pagesOk.forEach(page => {
    const text = page.text.toLowerCase();
    if (hasAny(text, WHAT_KEYWORDS)) whatCount += 1;
    if (hasAny(text, WHO_KEYWORDS)) whoCount += 1;
    if (hasAny(text, HOW_KEYWORDS)) howCount += 1;
    if (hasAny(text, TRUST_KEYWORDS)) trustCount += 1;
  });

  return {
    whatRate: whatCount / total,
    whoRate: whoCount / total,
    howRate: howCount / total,
    trustRate: trustCount / total,
  };
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function computeScores(
  pages: PageSummary[],
  seedUrl: string,
  origin: string,
  signals: SiteAuditSignals
): SiteAuditScores {
  const aiReadiness = computeAiReadinessScore(pages, seedUrl, origin, signals.answerability);
  const structure = computeStructureScore(signals);
  const contentDepth = computeContentDepthScore(signals);
  const technicalReadiness = computeTechnicalReadinessScore(signals);

  return {
    aiReadiness,
    structure,
    contentDepth,
    technicalReadiness,
    overall: aiReadiness,
  };
}

function computeAiReadinessScore(
  pages: PageSummary[],
  seedUrl: string,
  origin: string,
  answerability: SiteAuditSignals['answerability']
): number {
  const pagesOk = pages.filter(page => page.status > 0 && page.status < 400);
  const total = pagesOk.length || 1;

  const target = 0.35;
  const dimScore = (rate: number) => Math.min(1, rate / target) * 25;

  let score =
    dimScore(answerability.whatRate) +
    dimScore(answerability.whoRate) +
    dimScore(answerability.howRate) +
    dimScore(answerability.trustRate);
  
  // Cap base score at 94 to allow homepage bonus
  score = Math.min(94, score);

  const home = findHomepage(pagesOk, seedUrl, origin);
  if (home) {
    const text = home.text.toLowerCase();
    if (hasAny(text, WHAT_KEYWORDS)) score += 3;
    if (hasAny(text, HOW_KEYWORDS)) score += 3;
  }

  return clampScore(score);
}

function findHomepage(pages: PageSummary[], seedUrl: string, origin: string): PageSummary | undefined {
  const normalizedSeed = new URL(seedUrl, origin).toString();
  const homeCandidates = [origin, `${origin}/`, normalizedSeed];
  return pages.find(page => homeCandidates.includes(page.url));
}

function computeStructureScore(signals: SiteAuditSignals): number {
  const score =
    40 * signals.titleRate +
    35 * signals.h1Rate +
    25 * signals.metaRate;
  return clampScore(score);
}

function computeContentDepthScore(signals: SiteAuditSignals): number {
  let textLengthScore = 20;
  if (signals.avgText >= 6000) textLengthScore = 75; // Changed from 70 to allow 100 max score
  else if (signals.avgText >= 2500) textLengthScore = 55;
  else if (signals.avgText >= 1200) textLengthScore = 40;

  let h2Score = 0;
  if (signals.avgH2 >= 6) h2Score = 25;
  else if (signals.avgH2 >= 3) h2Score = 15;
  else if (signals.avgH2 >= 1) h2Score = 5;

  return clampScore(textLengthScore + h2Score);
}

function computeTechnicalReadinessScore(signals: SiteAuditSignals): number {
  const score =
    45 * signals.jsonLdRate +
    30 * signals.canonicalRate +
    25 * (1 - signals.errorRate);
  return clampScore(score);
}

function clampScore(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round(clamped);
}

function computeGrades(scores: SiteAuditScores): SiteAuditGrades {
  return {
    aiReadiness: toGrade(scores.aiReadiness),
    structure: toGrade(scores.structure),
    contentDepth: toGrade(scores.contentDepth),
    technicalReadiness: toGrade(scores.technicalReadiness),
    overall: toGrade(scores.overall),
  };
}

function toGrade(score: number): string {
  if (score === 100) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function computeTier(grades: SiteAuditGrades): 'Gold' | 'Silver' | 'Bronze' {
  const overall = grades.overall;
  const technicalReadiness = grades.technicalReadiness;
  const contentDepth = grades.contentDepth;

  if (
    overall === 'A+' ||
    overall === 'A' ||
    (overall === 'B' && technicalReadiness !== 'D' && technicalReadiness !== 'F' && contentDepth !== 'D' && contentDepth !== 'F')
  ) {
    return 'Gold';
  }

  if (overall === 'B' || overall === 'C') {
    return 'Silver';
  }

  return 'Bronze';
}

function buildExplanations(
  pages: PageSummary[],
  signals: SiteAuditSignals,
  scores: SiteAuditScores,
  grades: SiteAuditGrades,
  tier: 'Gold' | 'Silver' | 'Bronze'
): SiteAuditExplanations {
  const totalPages = pages.length || 0;

  const aiStrengths: string[] = [];
  const aiGaps: string[] = [];
  const aiImprovements: string[] = [];

  if (signals.answerability.whatRate >= 0.35) {
    aiStrengths.push(`Clear "what you do" messaging appears on ${formatRate(signals.answerability.whatRate, totalPages)} pages.`);
  } else {
    aiGaps.push(`"What you do" messaging appears on only ${formatRate(signals.answerability.whatRate, totalPages)} pages.`);
  }

  if (signals.answerability.whoRate >= 0.35) {
    aiStrengths.push(`"Who it's for" messaging appears on ${formatRate(signals.answerability.whoRate, totalPages)} pages.`);
  } else {
    aiGaps.push(`"Who it's for" messaging appears on only ${formatRate(signals.answerability.whoRate, totalPages)} pages.`);
  }

  if (signals.answerability.howRate >= 0.35) {
    aiStrengths.push(`"How it works" details appear on ${formatRate(signals.answerability.howRate, totalPages)} pages.`);
  } else {
    aiGaps.push(`"How it works" details appear on only ${formatRate(signals.answerability.howRate, totalPages)} pages.`);
  }

  if (signals.answerability.trustRate >= 0.35) {
    aiStrengths.push(`Trust signals appear on ${formatRate(signals.answerability.trustRate, totalPages)} pages.`);
  } else {
    aiGaps.push(`Trust signals appear on only ${formatRate(signals.answerability.trustRate, totalPages)} pages.`);
  }

  if (aiGaps.length === 0) {
    aiImprovements.push('Expand high-performing messaging across more key pages to lock in AI comprehension.');
  } else {
    aiImprovements.push('Add explicit "what/who/how/trust" statements to priority pages to reach 35% coverage.');
  }

  const structureStrengths: string[] = [];
  const structureGaps: string[] = [];
  const structureImprovements: string[] = [];

  if (signals.titleRate >= 0.7) {
    structureStrengths.push(`Titles are present on ${Math.round(signals.titleRate * 100)}% of pages.`);
  } else {
    structureGaps.push(`Titles are missing on ${(100 - Math.round(signals.titleRate * 100))}% of pages.`);
  }

  if (signals.h1Rate >= 0.7) {
    structureStrengths.push(`H1 headings appear on ${Math.round(signals.h1Rate * 100)}% of pages.`);
  } else {
    structureGaps.push(`H1 headings are inconsistent across ${(100 - Math.round(signals.h1Rate * 100))}% of pages.`);
  }

  if (signals.metaRate >= 0.6) {
    structureStrengths.push(`Meta descriptions appear on ${Math.round(signals.metaRate * 100)}% of pages.`);
  } else {
    structureGaps.push(`Meta descriptions are missing on ${(100 - Math.round(signals.metaRate * 100))}% of pages.`);
  }

  if (structureGaps.length === 0) {
    structureImprovements.push('Standardize title and meta copy lengths for consistent AI parsing.');
  } else {
    structureImprovements.push('Fill missing titles, H1s, and meta descriptions on key pages.');
  }

  const contentStrengths: string[] = [];
  const contentGaps: string[] = [];
  const contentImprovements: string[] = [];

  if (signals.avgText >= 2500) {
    contentStrengths.push(`Average page text length is ${Math.round(signals.avgText)} characters.`);
  } else {
    contentGaps.push(`Average page text length is ${Math.round(signals.avgText)} characters (target 2500+).`);
  }

  if (signals.avgH2 >= 3) {
    contentStrengths.push(`Average H2 count is ${signals.avgH2.toFixed(1)} per page.`);
  } else {
    contentGaps.push(`Average H2 count is ${signals.avgH2.toFixed(1)} per page (target 3+).`);
  }

  if (contentGaps.length === 0) {
    contentImprovements.push('Expand content modules to deepen topic coverage and maintain freshness.');
  } else {
    contentImprovements.push('Add depth sections (H2/H3) and expand copy to exceed 2500 characters.');
  }

  const techStrengths: string[] = [];
  const techGaps: string[] = [];
  const techImprovements: string[] = [];

  if (signals.jsonLdRate > 0) {
    techStrengths.push(`JSON-LD is present on ${Math.round(signals.jsonLdRate * 100)}% of pages.`);
  } else {
    techGaps.push('No JSON-LD detected on scanned pages.');
  }

  if (signals.canonicalRate >= 0.6) {
    techStrengths.push(`Canonical tags appear on ${Math.round(signals.canonicalRate * 100)}% of pages.`);
  } else {
    techGaps.push(`Canonical tags are missing on ${(100 - Math.round(signals.canonicalRate * 100))}% of pages.`);
  }

  if (signals.errorRate <= 0.15) {
    techStrengths.push(`Error rate is ${Math.round(signals.errorRate * 100)}%.`);
  } else {
    techGaps.push(`Error rate is ${Math.round(signals.errorRate * 100)}% (target <= 15%).`);
  }

  if (techGaps.length === 0) {
    techImprovements.push('Extend schema coverage and keep canonical tags consistent across all templates.');
  } else {
    techImprovements.push('Add JSON-LD, fix canonical gaps, and resolve error pages.');
  }

  const tierWhy = buildTierWhy(scores, grades, tier);

  return {
    tierWhy,
    perCategory: {
      aiReadiness: {
        strengths: aiStrengths,
        gaps: aiGaps,
        improvements: aiImprovements,
      },
      structure: {
        strengths: structureStrengths,
        gaps: structureGaps,
        improvements: structureImprovements,
      },
      contentDepth: {
        strengths: contentStrengths,
        gaps: contentGaps,
        improvements: contentImprovements,
      },
      technicalReadiness: {
        strengths: techStrengths,
        gaps: techGaps,
        improvements: techImprovements,
      },
    },
  };
}

function buildTierWhy(
  scores: SiteAuditScores,
  grades: SiteAuditGrades,
  tier: 'Gold' | 'Silver' | 'Bronze'
): string[] {
  const why: string[] = [];
  if (tier === 'Gold') {
    why.push(`Overall AI readiness is ${scores.overall}/100 (${grades.overall}).`);
    if (grades.overall === 'B') {
      why.push('Content depth and technical readiness meet minimum C thresholds.');
    }
  } else if (tier === 'Silver') {
    why.push(`Overall AI readiness is ${scores.overall}/100 (${grades.overall}).`);
    why.push('Improve technical readiness and content depth to reach Gold.');
  } else {
    why.push(`Overall AI readiness is ${scores.overall}/100 (${grades.overall}).`);
    why.push('Core answerability and technical readiness need improvement to move beyond Bronze.');
  }
  return why;
}

function formatRate(rate: number, totalPages: number): string {
  const safeTotal = totalPages || 1;
  const count = Math.round(rate * safeTotal);
  return `${count}/${safeTotal}`;
}

function buildRecommendations(signals: SiteAuditSignals): StructuredRecommendations[] {
  const recs: StructuredRecommendations[] = [];

  const rules: Array<{
    id: string;
    category: string;
    priority: StructuredRecommendations['priority'];
    when: (signals: SiteAuditSignals) => boolean;
    issue: string;
    recommendation: string;
    impact: string;
    effort: StructuredRecommendations['effort'];
  }> = [
    {
      id: 'ai-what-missing',
      category: 'AI Readiness',
      priority: 'high',
      when: (s) => s.answerability.whatRate < 0.2,
      issue: '"What you do" messaging is missing or rare across scanned pages.',
      recommendation: 'Add explicit "what we do" statements on key pages and in hero sections.',
      impact: 'High - AI systems struggle to classify offerings without clear statements.',
      effort: 'low',
    },
    {
      id: 'ai-who-missing',
      category: 'AI Readiness',
      priority: 'high',
      when: (s) => s.answerability.whoRate < 0.2,
      issue: '"Who it\'s for" messaging is missing or rare across scanned pages.',
      recommendation: 'Add target audience statements (teams, industries, personas) across primary pages.',
      impact: 'High - Audience clarity improves answerability and relevance.',
      effort: 'low',
    },
    {
      id: 'ai-how-missing',
      category: 'AI Readiness',
      priority: 'medium',
      when: (s) => s.answerability.howRate < 0.2,
      issue: '"How it works" content is missing or rare across scanned pages.',
      recommendation: 'Publish "how it works" sections, feature workflows, or onboarding steps.',
      impact: 'Medium - Helps AI models explain product functionality.',
      effort: 'medium',
    },
    {
      id: 'structure-meta-missing',
      category: 'Structure',
      priority: 'high',
      when: (s) => s.metaRate < 0.6,
      issue: 'Meta descriptions are missing on many pages.',
      recommendation: 'Add unique meta descriptions for core pages and templates.',
      impact: 'High - Meta descriptions improve summarization and relevance signals.',
      effort: 'low',
    },
    {
      id: 'structure-h1-inconsistent',
      category: 'Structure',
      priority: 'medium',
      when: (s) => s.h1Rate < 0.6,
      issue: 'H1 headings are inconsistent across scanned pages.',
      recommendation: 'Ensure every key page has a single, descriptive H1.',
      impact: 'Medium - Clear structure improves AI parsing and accessibility.',
      effort: 'low',
    },
    {
      id: 'tech-jsonld-missing',
      category: 'Technical Readiness',
      priority: 'high',
      when: (s) => s.jsonLdRate === 0,
      issue: 'No JSON-LD structured data detected.',
      recommendation: 'Implement JSON-LD schema (Organization, Product/Service, FAQ where relevant).',
      impact: 'High - Structured data is a primary AI parsing signal.',
      effort: 'medium',
    },
    {
      id: 'tech-canonical-low',
      category: 'Technical Readiness',
      priority: 'medium',
      when: (s) => s.canonicalRate < 0.6,
      issue: 'Canonical tags are missing on many pages.',
      recommendation: 'Add canonical tags to all indexable pages and templates.',
      impact: 'Medium - Canonicals help AI avoid duplicates and identify primary pages.',
      effort: 'low',
    },
    {
      id: 'tech-errors-high',
      category: 'Technical Readiness',
      priority: 'high',
      when: (s) => s.errorRate > 0.15,
      issue: 'High error rate detected across scanned pages.',
      recommendation: 'Fix broken URLs, update redirects, and remove 4xx/5xx pages from navigation.',
      impact: 'High - Errors reduce crawl coverage and AI trust.',
      effort: 'medium',
    },
    {
      id: 'tech-sitemap-missing',
      category: 'Technical Readiness',
      priority: 'medium',
      when: (s) => s.usedSitemap === false,
      issue: 'Sitemap.xml was not detected or accessible.',
      recommendation: 'Publish and verify sitemap.xml, then submit it to search consoles.',
      impact: 'Medium - Sitemaps improve crawl coverage and determinism.',
      effort: 'low',
    },
  ];

  rules.forEach(rule => {
    if (rule.when(signals)) {
      recs.push({
        priority: rule.priority,
        category: rule.category,
        issue: rule.issue,
        recommendation: rule.recommendation,
        impact: rule.impact,
        effort: rule.effort,
      });
    }
  });

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}
