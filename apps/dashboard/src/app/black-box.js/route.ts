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
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:11',message:'Route handler called',data:{cwd:process.cwd(),env:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Try multiple possible paths for the compiled script
    // Priority: public folder (copied during build) > relative paths > absolute paths
    // In Next.js API routes, process.cwd() is typically the project root (apps/dashboard)
    // In Vercel, it might be the monorepo root, so we check both
    const cwd = process.cwd();
    const possiblePaths = [
      join(cwd, 'public/black-box.js'), // Copied during prebuild (when cwd is apps/dashboard)
      join(cwd, 'apps/dashboard/public/black-box.js'), // When cwd is monorepo root (Vercel)
      join(cwd, '../../black-box/dist/runtime.global.js'), // Fallback: relative from apps/dashboard
      join(cwd, '../black-box/dist/runtime.global.js'), // Fallback: sibling directory
      join(cwd, 'apps/black-box/dist/runtime.global.js'), // Fallback: from monorepo root
    ];

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:16',message:'Testing paths',data:{paths:possiblePaths,pathCount:possiblePaths.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    let scriptContent: string | null = null;
    let lastError: Error | null = null;

    for (const scriptPath of possiblePaths) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:25',message:'Attempting to read file',data:{scriptPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        scriptContent = await readFile(scriptPath, 'utf-8');
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:27',message:'File read successful',data:{scriptPath,contentLength:scriptContent?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        break;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:30',message:'File read failed',data:{scriptPath,error:(error as Error).message,errorCode:(error as NodeJS.ErrnoException).code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        lastError = error as Error;
        continue;
      }
    }

    if (!scriptContent) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:35',message:'All paths failed',data:{lastError:lastError?.message,allPathsTried:possiblePaths},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'black-box.js/route.ts:48',message:'Error caught in handler',data:{error:(error as Error).message,stack:(error as Error).stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('Error serving Black Box script:', error);
    
    const origin = request.headers.get('origin');
    // Fallback: return a message if script not found
    return new NextResponse(
      `console.error('[Panthera Black Box] Script not found. Please build the Black Box: pnpm --filter @careerdriver/black-box build');`,
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
