import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { sites, configVersions } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, ValidationError } from '@gpto/api/src/errors';
import { randomUUID } from 'crypto';
import { getSites } from '@/lib/dashboard-helpers';

/**
 * GET /api/sites
 * 
 * List all sites (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token); // Verify token is valid

    // Query sites with role-based filtering
    const sitesList = await getSites(request);

    return NextResponse.json({
      data: sitesList,
      total: sitesList.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites
 * 
 * Create a new site (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    // #region agent log
    const fs = await import('fs/promises');
    const logPath = '/Users/braiebook/GPTO/.cursor/debug.log';
    await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:50',message:'POST /api/sites called',data:{authHeaderExists:!!authHeader,authHeaderValue:authHeader?authHeader.substring(0,30)+'...':null,authHeaderLength:authHeader?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n').catch(()=>{});
    // #endregion
    
    const token = extractToken(authHeader ?? undefined);
    
    // #region agent log
    await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:56',message:'Token extracted',data:{tokenExists:!!token,tokenLength:token?.length||0,tokenValue:token?token.substring(0,20)+'...':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n').catch(()=>{});
    // #endregion
    
    if (!token) {
      // #region agent log
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:59',message:'No token found - throwing AuthenticationError',data:{authHeader:authHeader},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n').catch(()=>{});
      // #endregion
      throw new AuthenticationError();
    }

    // #region agent log
    let payload = null;
    try {
      payload = verifyToken(token);
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:65',message:'Token verified successfully',data:{userId:payload.userId,email:payload.email,role:payload.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})+'\n').catch(()=>{});
    } catch (err) {
      const verifyError = err instanceof Error ? err.message : String(err);
      await fs.appendFile(logPath, JSON.stringify({location:'api/sites/route.ts:65',message:'Token verification failed',data:{error:verifyError,tokenLength:token.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})+'\n').catch(()=>{});
      throw err;
    }
    // #endregion

    const body = await request.json();
    const { domain, brand, verticals = [], geo = [] } = body;

    // Validation
    if (!domain || typeof domain !== 'string') {
      throw new ValidationError('Domain is required');
    }

    if (!brand || typeof brand !== 'string') {
      throw new ValidationError('Brand name is required');
    }

    // Create site
    const siteId = randomUUID();
    const [newSite] = await db
      .insert(sites)
      .values({
        id: siteId,
        domain: domain.trim(),
        status: 'pending',
        configUrl: `/api/sites/${siteId}/config`,
      })
      .returning();

    // Create initial config version (must match siteConfigSchema)
    const initialConfig = {
      panthera_blackbox: {
        version: '1.2.0',
        site: {
          domain: domain.trim(),
          brand: brand.trim(),
          verticals: Array.isArray(verticals) ? verticals : [],
          geo: Array.isArray(geo) ? geo : [],
        },
        telemetry: {
          emit: true,
          keys: [
            'ts.authority',
            'ai.schemaCompleteness',
            'ai.structuredDataQuality',
            'ai.authoritySignals',
            'ai.searchVisibility',
          ],
          periodic: {
            enabled: true,
            intervalMs: 300000,
          },
        },
        tier: 'bronze' as const,
        authority_grove: {
          node: {
            id: `https://${domain.trim()}`,
            type: 'Organization',
            name: brand.trim(),
            sameAs: [],
            keywords: [],
          },
          partners: [],
          trustEdges: [],
          corroboration: [],
        },
        seo_enhancements: {
          meta_description: `${brand.trim()} - Optimize your website for AI search engines`,
          canonical_enabled: true,
          content_enhancements: {
            enabled: true,
            what: `We help businesses optimize their online presence for AI search engines like ChatGPT, Perplexity, and Claude.`,
            who: `Our platform is designed for teams, businesses, and companies looking to improve their AI search visibility.`,
            how: `Get started by installing our Black Box runtime, configure your Authority Grove, and watch your scores improve automatically.`,
            trust: `Trusted by leading companies. We maintain security, privacy, and compliance standards including GDPR and SOC 2.`,
          },
          content_depth: {
            enabled: true,
            min_h2_count: 6,
            h2_templates: [
              'About Our Platform',
              'Key Features',
              'How It Works',
              'Pricing Plans',
              'Customer Success Stories',
              'Getting Started',
            ],
            content_templates: [
              'Our platform provides comprehensive solutions for AI search optimization, helping businesses improve their visibility in AI-powered search engines.',
              'Key features include automated schema injection, authority signal building, and real-time score tracking.',
              'The platform works seamlessly by injecting structured data and content enhancements that AI models can easily parse and understand.',
              'Flexible pricing plans are available to suit businesses of all sizes, from startups to enterprise organizations.',
              'Join hundreds of satisfied customers who have improved their AI search visibility and increased organic traffic.',
              'Getting started is easy - simply install the Black Box runtime and configure your settings through our intuitive dashboard.',
            ],
            default_content: 'This section provides additional context and information for AI search engines to better understand your content and improve search visibility.',
          },
          structure_enhancements: {
            inject_h1_if_missing: true,
            h1_text: `Welcome to ${brand.trim()}`,
            enhance_title: true,
            min_title_length: 30,
            title_template: `${brand.trim()} - AI Search Optimization Platform`,
          },
        },
        policy: {
          privacy_mode: 'anon' as const,
          log_level: 'basic' as const,
        },
      },
    };

    await db.insert(configVersions).values({
      siteId: newSite.id,
      version: '1.2.0',
      configJson: initialConfig,
      isActive: true,
      createdBy: payload.userId,
    });

    return NextResponse.json({
      success: true,
      data: newSite,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
