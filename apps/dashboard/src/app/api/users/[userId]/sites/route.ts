import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { userSiteAccess, sites, users } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, ValidationError, NotFoundError } from '@gpto/api/src/errors';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/users/[userId]/sites
 * 
 * List sites accessible to a user
 * Admin can view any user's sites, users can view their own
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:15',message:'GET user sites request started',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:25',message:'Token verified',data:{userId:payload.userId,role:payload.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Verify user exists
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:35',message:'Before querying user',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const [targetUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:42',message:'User query result',data:{userFound:!!targetUser,userId:targetUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Only admin can view other users' sites, or users can view their own
    if (payload.role !== 'admin' && payload.userId !== userId) {
      throw new AuthenticationError('Access denied');
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:50',message:'Before querying user_site_access',data:{userSiteAccessExists:!!userSiteAccess,userSiteAccessType:typeof userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Get sites from user_site_access
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:47',message:'Before querying user_site_access table',data:{userId,userSiteAccessExists:!!userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    let assignedSites: typeof sites.$inferSelect[] = [];
    try {
      assignedSites = await db
        .select({
          id: sites.id,
          domain: sites.domain,
          status: sites.status,
          tenantId: sites.tenantId,
          createdAt: sites.createdAt,
          updatedAt: sites.updatedAt,
        })
        .from(userSiteAccess)
        .innerJoin(sites, eq(userSiteAccess.siteId, sites.id))
        .where(eq(userSiteAccess.userId, userId));
      
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:60',message:'Successfully queried user_site_access',data:{assignedSitesCount:assignedSites.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (queryError) {
      // #region agent log
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      const errorCode = (queryError as { code?: string })?.code;
      const isTableMissing = errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01';
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:65',message:'Failed to query user_site_access',data:{error:errorMessage,errorCode,isTableMissing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // If table doesn't exist, return empty array instead of error
      // This allows the UI to work even if migration hasn't been run yet
      if (isTableMissing) {
        console.warn('user_site_access table does not exist. Please run database migrations.');
        assignedSites = [];
      } else {
        throw queryError;
      }
    }

    // Also get sites matching tenantId if user has tenantId
    const [userRecord] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let tenantSites: typeof assignedSites = [];
    if (userRecord?.tenantId) {
      tenantSites = await db
        .select({
          id: sites.id,
          domain: sites.domain,
          status: sites.status,
          tenantId: sites.tenantId,
          createdAt: sites.createdAt,
          updatedAt: sites.updatedAt,
        })
        .from(sites)
        .where(eq(sites.tenantId, userRecord.tenantId));
    }

    // Combine and deduplicate
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:130',message:'Before combining sites',data:{assignedSitesCount:assignedSites.length,tenantSitesCount:tenantSites.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    const allSitesMap = new Map<string, typeof assignedSites[0]>();
    [...assignedSites, ...tenantSites].forEach((site) => {
      allSitesMap.set(site.id, site);
    });

    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:137',message:'Before returning response',data:{totalSites:allSitesMap.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      data: Array.from(allSitesMap.values()),
      total: allSitesMap.size,
    });
  } catch (error) {
    // #region agent log
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const isTableMissing = errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01';
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:95',message:'Error caught in GET handler',data:{errorMessage,errorCode,isTableMissing,errorType:error?.constructor?.name,isAuthError:error instanceof AuthenticationError,isNotFoundError:error instanceof NotFoundError,errorStack:errorStack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching user sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user sites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[userId]/sites
 * 
 * Assign site access to user (admin only)
 * Body: { siteIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    // Only admin can assign site access
    if (payload.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    // Verify user exists
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    const body = await request.json();
    const { siteIds } = body;

    if (!Array.isArray(siteIds) || siteIds.length === 0) {
      throw new ValidationError('siteIds must be a non-empty array');
    }

    // Verify all sites exist
    const existingSites = await db
      .select({ id: sites.id })
      .from(sites)
      .where(inArray(sites.id, siteIds));

    if (existingSites.length !== siteIds.length) {
      throw new ValidationError('One or more sites not found');
    }

    // Get existing assignments to avoid duplicates
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:225',message:'Before querying existing assignments',data:{userId,siteIdsCount:siteIds.length,userSiteAccessExists:!!userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    let existingAssignments: Array<{ siteId: string }> = [];
    try {
      existingAssignments = await db
        .select({ siteId: userSiteAccess.siteId })
        .from(userSiteAccess)
        .where(eq(userSiteAccess.userId, userId));
      
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:232',message:'Successfully queried existing assignments',data:{existingCount:existingAssignments.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
    } catch (queryError) {
      // #region agent log
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      const errorCode = (queryError as { code?: string })?.code;
      const isTableMissing = errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01';
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:237',message:'Failed to query existing assignments',data:{error:errorMessage,errorCode,isTableMissing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      if (isTableMissing) {
        throw new ValidationError('user_site_access table does not exist. Please run database migrations: pnpm --filter @gpto/database migrate');
      }
      throw queryError;
    }

    const existingSiteIds = new Set(existingAssignments.map((a) => a.siteId));
    const newSiteIds = siteIds.filter((id) => !existingSiteIds.has(id));

    // Insert new assignments
    if (newSiteIds.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:250',message:'Before inserting site access',data:{userId,newSiteIdsCount:newSiteIds.length,userSiteAccessExists:!!userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      
      try {
        await db.insert(userSiteAccess).values(
          newSiteIds.map((siteId) => ({
            userId,
            siteId,
            createdBy: payload.userId,
          }))
        );
        
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:260',message:'Successfully inserted site access',data:{insertedCount:newSiteIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
      } catch (insertError) {
        // #region agent log
        const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
        const errorCode = (insertError as { code?: string })?.code;
        const isTableMissing = errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01';
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/[userId]/sites/route.ts:265',message:'Failed to insert site access',data:{error:errorMessage,errorCode,isTableMissing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
        // #endregion
        
        if (isTableMissing) {
          throw new ValidationError('user_site_access table does not exist. Please run database migrations: pnpm --filter @gpto/database migrate');
        }
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      assigned: newSiteIds.length,
      total: siteIds.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error assigning site access:', error);
    return NextResponse.json(
      { error: 'Failed to assign site access' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userId]/sites
 * 
 * Remove site access from user (admin only)
 * Body: { siteIds: string[] }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    // Only admin can remove site access
    if (payload.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const body = await request.json();
    const { siteIds } = body;

    if (!Array.isArray(siteIds) || siteIds.length === 0) {
      throw new ValidationError('siteIds must be a non-empty array');
    }

    // Remove assignments
    await db
      .delete(userSiteAccess)
      .where(
        and(
          eq(userSiteAccess.userId, userId),
          inArray(userSiteAccess.siteId, siteIds)
        )
      );

    return NextResponse.json({
      success: true,
      removed: siteIds.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error removing site access:', error);
    return NextResponse.json(
      { error: 'Failed to remove site access' },
      { status: 500 }
    );
  }
}
