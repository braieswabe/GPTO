import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import { fixConfig, SAMPLE_CONFIGS } from '@gpto/schemas';

/**
 * POST /api/config/fix
 * 
 * Automatically fixes a configuration by:
 * - Removing invalid fields
 * - Adding missing required fields
 * - Fixing invalid values
 * - Ensuring schema compliance
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
    const { config, referenceType } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Missing required field: config' },
        { status: 400 }
      );
    }

    // Select reference config based on type or auto-detect
    let referenceConfig;
    if (referenceType && SAMPLE_CONFIGS[referenceType as keyof typeof SAMPLE_CONFIGS]) {
      referenceConfig = SAMPLE_CONFIGS[referenceType as keyof typeof SAMPLE_CONFIGS];
    } else {
      // Auto-detect based on verticals
      const configObj = config as any;
      const verticals = configObj?.panthera_blackbox?.site?.verticals || [];
      
      if (verticals.some((v: string) => ['healthcare', 'medical', 'health'].includes(v.toLowerCase()))) {
        referenceConfig = SAMPLE_CONFIGS.healthcare;
      } else if (verticals.some((v: string) => ['ecommerce', 'retail', 'shopping'].includes(v.toLowerCase()))) {
        referenceConfig = SAMPLE_CONFIGS.ecommerce;
      } else if (verticals.some((v: string) => ['education', 'university', 'school'].includes(v.toLowerCase()))) {
        referenceConfig = SAMPLE_CONFIGS.education;
      } else {
        referenceConfig = SAMPLE_CONFIGS.minimal;
      }
    }

    // Fix the configuration
    const result = fixConfig(config, referenceConfig);

    return NextResponse.json({
      success: result.errors.length === 0,
      fixedConfig: result.fixedConfig,
      errors: result.errors,
      fixes: result.fixes,
      message: result.fixes.length > 0
        ? `Fixed ${result.fixes.length} issue(s): ${result.fixes.join(', ')}`
        : 'Configuration is valid',
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fixing config:', error);
    return NextResponse.json(
      { error: 'Failed to fix configuration' },
      { status: 500 }
    );
  }
}
