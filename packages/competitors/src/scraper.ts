import * as cheerio from 'cheerio';

export interface CompetitorData {
  domain: string;
  title?: string;
  description?: string;
  headings: string[];
  content: string;
  links: Array<{ url: string; text: string }>;
  metaKeywords?: string[];
  schemaData?: unknown[];
  timestamp: Date;
}

/**
 * Scrape competitor website
 */
export async function scrapeCompetitor(domain: string): Promise<CompetitorData> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTOBot/1.0; +https://gpto.ai/bot)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract basic data
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];

    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push(text);
      }
    });

    // Extract main content (simplified - would use more sophisticated extraction in production)
    const content = $('main, article, .content, #content').first().text().trim() || $('body').text().trim();

    // Extract links
    const links: Array<{ url: string; text: string }> = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        // Resolve relative URLs
        const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).toString();
        links.push({ url: absoluteUrl, text });
      }
    });

    // Extract JSON-LD schema data
    const schemaData: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          schemaData.push(parsed);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    return {
      domain,
      title,
      description,
      headings,
      content,
      links,
      metaKeywords,
      schemaData,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`Error scraping ${domain}:`, error);
    throw error;
  }
}

/**
 * Scrape multiple competitors
 */
export async function scrapeCompetitors(domains: string[]): Promise<CompetitorData[]> {
  const results = await Promise.allSettled(
    domains.map(domain => scrapeCompetitor(domain))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<CompetitorData> => r.status === 'fulfilled')
    .map(r => r.value);
}
