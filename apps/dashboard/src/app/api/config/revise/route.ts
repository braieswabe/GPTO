import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { validator } from '@gpto/schemas';
import { siteConfigSchema } from '@gpto/schemas/src/site-config';
import { migrateConfig } from '@gpto/api';

/**
 * POST /api/config/revise
 * 
 * Revise configuration JSON based on natural language instruction
 * Uses LLM to understand user intent and modify config accordingly
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    verifyToken(token);

    const body = await request.json();
    const { currentConfig, instruction } = body;

    if (!currentConfig || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields: currentConfig, instruction' },
        { status: 400 }
      );
    }

    // Migrate config if needed
    const migratedConfig = migrateConfig(currentConfig);

    // Generate revised config using LLM
    // In production, this would call OpenAI/Anthropic API
    // For now, we'll use a smart rule-based approach that understands common patterns
    
    const revisedConfig = await reviseConfigWithLLM(migratedConfig, instruction);

    // Validate the revised config
    const isValid = validator.validate(siteConfigSchema, revisedConfig);
    
    if (!isValid) {
      const errors = validator.getErrors();
      return NextResponse.json({
        success: false,
        error: 'Revised configuration is invalid',
        details: errors,
        revisedConfig, // Still return it so user can see what was generated
      }, { status: 400 });
    }

    // Build explanation of what changed
    const changes: string[] = [];
    const revised = revisedConfig as any;
    const original = migratedConfig as any;
    
    // Compare and detect changes
    if (revised?.panthera_blackbox?.telemetry?.emit !== original?.panthera_blackbox?.telemetry?.emit) {
      changes.push(`Telemetry ${revised.panthera_blackbox.telemetry.emit ? 'enabled' : 'disabled'}`);
    }
    if (revised?.panthera_blackbox?.site?.brand && revised.panthera_blackbox.site.brand !== original?.panthera_blackbox?.site?.brand) {
      changes.push(`Brand changed to "${revised.panthera_blackbox.site.brand}"`);
    }
    if (revised?.panthera_blackbox?.site?.domain && revised.panthera_blackbox.site.domain !== original?.panthera_blackbox?.site?.domain) {
      changes.push(`Domain changed to "${revised.panthera_blackbox.site.domain}"`);
    }
    if (revised?.panthera_blackbox?.policy?.privacy_mode && revised.panthera_blackbox.policy.privacy_mode !== original?.panthera_blackbox?.policy?.privacy_mode) {
      changes.push(`Privacy mode set to "${revised.panthera_blackbox.policy.privacy_mode}"`);
    }
    if (revised?.panthera_blackbox?.policy?.log_level && revised.panthera_blackbox.policy.log_level !== original?.panthera_blackbox?.policy?.log_level) {
      changes.push(`Log level set to "${revised.panthera_blackbox.policy.log_level}"`);
    }
    if (revised?.panthera_blackbox?.autofill?.enabled !== original?.panthera_blackbox?.autofill?.enabled) {
      changes.push(`Autofill ${revised.panthera_blackbox.autofill.enabled ? 'enabled' : 'disabled'}`);
    }
    if (revised?.panthera_blackbox?.geo_nodes?.enabled !== original?.panthera_blackbox?.geo_nodes?.enabled) {
      changes.push(`Geo nodes ${revised.panthera_blackbox.geo_nodes.enabled ? 'enabled' : 'disabled'}`);
    }
    if (revised?.panthera_blackbox?.ads?.slots?.length > (original?.panthera_blackbox?.ads?.slots?.length || 0)) {
      changes.push(`Added ${revised.panthera_blackbox.ads.slots.length - (original?.panthera_blackbox?.ads?.slots?.length || 0)} ad slot(s)`);
    }
    
    const explanation = changes.length > 0
      ? `Configuration updated: ${changes.join(', ')}`
      : `Configuration processed based on: "${instruction}"`;
    
    // Log for debugging
    console.log('[Panthera] Config revision result:', {
      instruction,
      changesMade: changes.length > 0,
      changes,
      revisedConfigKeys: Object.keys(revised || {}),
    });

    return NextResponse.json({
      success: true,
      revisedConfig,
      explanation,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error revising config:', error);
    return NextResponse.json(
      { error: 'Failed to revise configuration' },
      { status: 500 }
    );
  }
}


/**
 * Revise config using LLM (placeholder - would use actual LLM in production)
 * This implementation uses pattern matching for common requests
 */
async function reviseConfigWithLLM(config: unknown, instruction: string): Promise<unknown> {
  const configObj = config as any;
  const instructionLower = instruction.toLowerCase();

  // Deep clone the config
  const revised = JSON.parse(JSON.stringify(configObj));
  
  // Ensure structure exists
  if (!revised.panthera_blackbox) {
    revised.panthera_blackbox = {};
  }
  if (!revised.panthera_blackbox.telemetry) {
    revised.panthera_blackbox.telemetry = { emit: false, keys: [] };
  }
  if (!revised.panthera_blackbox.policy) {
    revised.panthera_blackbox.policy = { privacy_mode: 'anon', log_level: 'basic' };
  }
  if (!revised.panthera_blackbox.site) {
    revised.panthera_blackbox.site = { domain: '', brand: '', verticals: [], geo: [] };
  }
  if (!revised.panthera_blackbox.autofill) {
    revised.panthera_blackbox.autofill = { enabled: false, forms: [] };
  }
  if (!revised.panthera_blackbox.ads) {
    revised.panthera_blackbox.ads = { slots: [] };
  }
  if (!revised.panthera_blackbox.geo_nodes) {
    revised.panthera_blackbox.geo_nodes = { enabled: false };
  }
  if (!revised.panthera_blackbox.truthseeker) {
    revised.panthera_blackbox.truthseeker = {
      weights: {
        intent_match: 0.3,
        anchor_match: 0.2,
        authority: 0.25,
        recency: 0.15,
        fairness: 0.1,
      },
    };
  }

  let changesMade = false;

  // Pattern matching for common instructions
  // In production, this would be replaced with actual LLM API calls

  // Telemetry patterns
  if (instructionLower.includes('enable telemetry') || instructionLower.includes('turn on telemetry')) {
    revised.panthera_blackbox.telemetry.emit = true;
    changesMade = true;
  }
  if (instructionLower.includes('disable telemetry') || instructionLower.includes('turn off telemetry')) {
    revised.panthera_blackbox.telemetry.emit = false;
    changesMade = true;
  }
  if (instructionLower.includes('add telemetry endpoint') || instructionLower.includes('telemetry endpoint')) {
    const endpointMatch = instruction.match(/endpoint[:\s]+([^\s]+)/i);
    if (endpointMatch && revised.panthera_blackbox?.telemetry) {
      const endpoint = endpointMatch[1];
      if (!revised.panthera_blackbox.telemetry.keys.includes(endpoint)) {
        revised.panthera_blackbox.telemetry.keys.push(endpoint);
      }
    }
  }

  // Policy patterns
  if (instructionLower.includes('privacy mode') || instructionLower.includes('privacy')) {
    if (instructionLower.includes('anonymous') || instructionLower.includes('anon')) {
      revised.panthera_blackbox.policy.privacy_mode = 'anon';
      changesMade = true;
    } else if (instructionLower.includes('full') || instructionLower.includes('strict')) {
      revised.panthera_blackbox.policy.privacy_mode = 'full';
      changesMade = true;
    } else if (instructionLower.includes('minimal')) {
      revised.panthera_blackbox.policy.privacy_mode = 'minimal';
      changesMade = true;
    }
  }

  if (instructionLower.includes('log level') || instructionLower.includes('logging')) {
    if (instructionLower.includes('basic')) {
      revised.panthera_blackbox.policy.log_level = 'basic';
      changesMade = true;
    } else if (instructionLower.includes('detailed')) {
      revised.panthera_blackbox.policy.log_level = 'detailed';
      changesMade = true;
    } else if (instructionLower.includes('verbose')) {
      revised.panthera_blackbox.policy.log_level = 'verbose';
      changesMade = true;
    }
  }

  // Site patterns - Brand/Title
  // Match: "brand: X", "company name: X", "titled X", "title: X", "make the website titled X"
  // Handle both quoted and unquoted values
  const brandPatterns = [
    /(?:brand|company name|title|titled)[:\s]+["']([^"']+)["']/i,  // Quoted: "GPTO Suite"
    /(?:brand|company name|title|titled)[:\s]+([^\s"'\n,]+)/i,      // Unquoted: GPTO Suite
    /make the website titled[:\s]+["']([^"']+)["']/i,               // "make the website titled "GPTO Suite""
    /make the website titled[:\s]+([^\s"'\n,]+)/i,                   // "make the website titled GPTO Suite"
  ];
  
  for (const pattern of brandPatterns) {
    const match = instruction.match(pattern);
    if (match) {
      const brandValue = match[1].trim();
      revised.panthera_blackbox.site.brand = brandValue;
      changesMade = true;
      console.log('[Panthera] Brand updated:', brandValue);
      break;
    }
  }

  if (instructionLower.includes('add vertical') || instructionLower.includes('vertical')) {
    const verticalMatch = instruction.match(/vertical[:\s]+([^\s,]+)/i);
    if (verticalMatch) {
      const vertical = verticalMatch[1].trim();
      if (!revised.panthera_blackbox.site.verticals.includes(vertical)) {
        revised.panthera_blackbox.site.verticals.push(vertical);
        changesMade = true;
      }
    }
  }

  if (instructionLower.includes('add geo') || instructionLower.includes('geography') || instructionLower.includes('region')) {
    const geoMatch = instruction.match(/geo[:\s]+([^\s,]+)/i) || instruction.match(/region[:\s]+([^\s,]+)/i);
    if (geoMatch) {
      const geo = geoMatch[1].trim();
      if (!revised.panthera_blackbox.site.geo.includes(geo)) {
        revised.panthera_blackbox.site.geo.push(geo);
        changesMade = true;
      }
    }
  }

  // Domain changes
  if (instructionLower.includes('domain') || instructionLower.includes('website url')) {
    const domainMatch = instruction.match(/domain[:\s]+([^\s\n]+)/i) || instruction.match(/website url[:\s]+([^\s\n]+)/i);
    if (domainMatch) {
      let domain = domainMatch[1].trim();
      // Remove protocol if present
      domain = domain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
      revised.panthera_blackbox.site.domain = domain;
      changesMade = true;
    }
  }

  // Autofill patterns
  if (instructionLower.includes('enable autofill') || instructionLower.includes('turn on autofill')) {
    revised.panthera_blackbox.autofill.enabled = true;
    changesMade = true;
  }
  if (instructionLower.includes('disable autofill') || instructionLower.includes('turn off autofill')) {
    revised.panthera_blackbox.autofill.enabled = false;
    changesMade = true;
  }
  if (instructionLower.includes('add autofill form') || instructionLower.includes('autofill form')) {
    const formMatch = instruction.match(/form[:\s]+([^\s\n]+)/i);
    if (formMatch) {
      const selector = formMatch[1].trim();
      if (!revised.panthera_blackbox.autofill.forms.find((f: any) => f.selector === selector)) {
        revised.panthera_blackbox.autofill.forms.push({ selector, map: {} });
        changesMade = true;
      }
    }
  }

  // Ads patterns
  if (instructionLower.includes('enable ads') || instructionLower.includes('turn on ads')) {
    if (!revised.panthera_blackbox.ads) {
      revised.panthera_blackbox.ads = { slots: [] };
    }
    changesMade = true;
  }
  if (instructionLower.includes('add ad slot') || instructionLower.includes('ad slot')) {
    // Match: "add ad slot: sidebar" or "ad slot: sidebar" or "ad slot sidebar"
    const adMatch = instruction.match(/slot[:\s]+["']?([^"'\s\n]+)["']?/i);
    if (adMatch) {
      // Remove quotes and sanitize the slot ID
      const slotId = adMatch[1].trim().replace(/["']/g, '');
      if (slotId && !revised.panthera_blackbox.ads.slots.find((s: any) => s.id === slotId)) {
        revised.panthera_blackbox.ads.slots.push({ id: slotId, contexts: [] });
        changesMade = true;
      }
    }
  }

  // Geo nodes patterns
  if (instructionLower.includes('enable geo nodes') || instructionLower.includes('turn on geo nodes')) {
    revised.panthera_blackbox.geo_nodes.enabled = true;
    changesMade = true;
  }
  if (instructionLower.includes('disable geo nodes') || instructionLower.includes('turn off geo nodes')) {
    revised.panthera_blackbox.geo_nodes.enabled = false;
    changesMade = true;
  }
  if (instructionLower.includes('cities max') || instructionLower.includes('max cities')) {
    const maxMatch = instruction.match(/(?:cities max|max cities)[:\s]+(\d+)/i);
    if (maxMatch) {
      revised.panthera_blackbox.geo_nodes.cities_max = parseInt(maxMatch[1], 10);
      changesMade = true;
    }
  }
  if (instructionLower.includes('attractions max') || instructionLower.includes('max attractions')) {
    const maxMatch = instruction.match(/(?:attractions max|max attractions)[:\s]+(\d+)/i);
    if (maxMatch) {
      revised.panthera_blackbox.geo_nodes.attractions_max = parseInt(maxMatch[1], 10);
      changesMade = true;
    }
  }

  // TruthSeeker weight patterns
  const weightPatterns = [
    { key: 'intent_match', patterns: ['intent match', 'intent weight', 'intent'] },
    { key: 'anchor_match', patterns: ['anchor match', 'anchor weight', 'anchor'] },
    { key: 'authority', patterns: ['authority weight', 'authority'] },
    { key: 'recency', patterns: ['recency weight', 'recency'] },
    { key: 'fairness', patterns: ['fairness weight', 'fairness'] },
  ];

  for (const { key, patterns } of weightPatterns) {
    for (const pattern of patterns) {
      const regex = new RegExp(`${pattern}[:\s]+(0\\.\\d+|0|1|\\d+%)`, 'i');
      const match = instruction.match(regex);
      if (match) {
        let value = parseFloat(match[1]);
        if (match[1].includes('%')) {
          value = value / 100;
        }
        if (value >= 0 && value <= 1) {
          revised.panthera_blackbox.truthseeker.weights[key] = value;
          changesMade = true;
          break;
        }
      }
    }
  }

  // Handle multiple instructions in one sentence (split by "and", "then", ",")
  // The patterns above already handle the full instruction, but we can also
  // process parts separately for better compound instruction handling
  // This is already handled by the pattern matching above, so no need for recursion

  // Log what was changed for debugging
  if (changesMade) {
    console.log('[Panthera] Config revised:', {
      instruction,
      changes: JSON.stringify(revised, null, 2).substring(0, 200),
    });
  } else {
    console.log('[Panthera] No pattern match found for:', instruction);
  }

  return revised;
}
