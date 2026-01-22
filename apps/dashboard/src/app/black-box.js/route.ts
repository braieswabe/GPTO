import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /black-box.js
 * 
 * Serve the compiled Black Box runtime script
 * This allows websites to load the script from your dashboard URL
 */
export async function GET(request: NextRequest) {
  try {
    // Try multiple possible paths for the compiled script
    const possiblePaths = [
      join(process.cwd(), '../../black-box/dist/runtime.global.js'),
      join(process.cwd(), '../black-box/dist/runtime.global.js'),
      join(process.cwd(), 'apps/black-box/dist/runtime.global.js'),
    ];

    let scriptContent: string | null = null;
    let lastError: Error | null = null;

    for (const scriptPath of possiblePaths) {
      try {
        scriptContent = await readFile(scriptPath, 'utf-8');
        break;
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    if (!scriptContent) {
      throw lastError || new Error('Script file not found in any expected location');
    }

    const origin = request.headers.get('origin');
    return new NextResponse(scriptContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year (immutable)
        'Access-Control-Allow-Origin': origin || '*', // Allow CORS for cross-origin sites
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving Black Box script:', error);
    
    const origin = request.headers.get('origin');
    // Fallback: return a message if script not found
    return new NextResponse(
      `console.error('[Panthera Black Box] Script not found. Please build the Black Box: pnpm --filter @gpto/black-box build');`,
      {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
