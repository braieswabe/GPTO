import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError } from '@gpto/api/src/errors';
import {
  parseAuthorityGrove,
  calculateAuthorityScore,
  generateBacklinkPlan,
  generateAuthoritySchema,
} from '@gpto/servos-gpto';

/**
 * POST /api/servos/gpto/authority
 * 
 * Manage authority nodes and generate authority plans
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
    const { action, config, targetSites } = body;

    if (!action || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: action, config' },
        { status: 400 }
      );
    }

    const grove = parseAuthorityGrove(config);
    if (!grove) {
      return NextResponse.json(
        { error: 'No authority grove configuration found' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'calculate_score': {
        const score = calculateAuthorityScore(grove.node.id, grove);
        return NextResponse.json({
          success: true,
          score,
          nodeId: grove.node.id,
        });
      }

      case 'generate_backlinks': {
        if (!targetSites || !Array.isArray(targetSites)) {
          return NextResponse.json(
            { error: 'targetSites array is required' },
            { status: 400 }
          );
        }
        const backlinks = generateBacklinkPlan(config, targetSites);
        return NextResponse.json({
          success: true,
          backlinks,
        });
      }

      case 'generate_schema': {
        const schema = generateAuthoritySchema(grove);
        return NextResponse.json({
          success: true,
          schema,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error managing authority:', error);
    return NextResponse.json(
      { error: 'Failed to manage authority' },
      { status: 500 }
    );
  }
}
