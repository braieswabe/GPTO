import { NextRequest, NextResponse } from 'next/server';
import { db } from '@gpto/database';
import { users } from '@gpto/database/src/schema';
import { extractToken, verifyToken } from '@gpto/api';
import { AuthenticationError, ValidationError } from '@gpto/api/src/errors';
import { desc, eq } from 'drizzle-orm';
import { hashPassword } from '@gpto/api/src/password';

/**
 * GET /api/users
 * 
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    // Only admin can list all users
    if (payload.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    // Query users (exclude password hash)
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      data: usersList,
      total: usersList.length,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * 
 * Create a new user (admin only)
 * Body: { email: string, password: string, role: string, tenantId?: string, siteIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);
    
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);

    // Only admin can create users
    if (payload.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const body = await request.json();
    const { email, password, role, tenantId, siteIds } = body;

    // Validation
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    if (!role || typeof role !== 'string') {
      throw new ValidationError('Role is required');
    }

    const validRoles = ['admin', 'operator', 'viewer', 'client'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    const passwordHash = hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        tenantId: tenantId || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Assign site access if siteIds provided
    if (siteIds && Array.isArray(siteIds) && siteIds.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:130',message:'Starting site access assignment',data:{userId:newUser.id,siteIdsCount:siteIds.length,siteIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const { userSiteAccess } = await import('@gpto/database/src/schema');
      const { sites } = await import('@gpto/database/src/schema');
      const { inArray } = await import('drizzle-orm');

      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:135',message:'Imported userSiteAccess schema',data:{userSiteAccessExists:!!userSiteAccess,userSiteAccessType:typeof userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Verify all sites exist
      const existingSites = await db
        .select({ id: sites.id })
        .from(sites)
        .where(inArray(sites.id, siteIds));

      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:142',message:'Verified sites exist',data:{existingSitesCount:existingSites.length,requestedSitesCount:siteIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (existingSites.length !== siteIds.length) {
        throw new ValidationError('One or more sites not found');
      }

      // Check if table exists by attempting a simple query first
      try {
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:150',message:'Before inserting site access',data:{userSiteAccessTableName:userSiteAccess?._?.name||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Insert site access assignments
        await db.insert(userSiteAccess).values(
          siteIds.map((siteId: string) => ({
            userId: newUser.id,
            siteId,
            createdBy: payload.userId,
          }))
        );
        
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:160',message:'Successfully inserted site access',data:{insertedCount:siteIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (insertError) {
        // #region agent log
        const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
        const errorCode = (insertError as { code?: string })?.code;
        const isTableMissing = errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorCode === '42P01';
        fetch('http://127.0.0.1:7251/ingest/f2bef142-91a5-4d7a-be78-4c2383eb5638',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/users/route.ts:165',message:'Failed to insert site access',data:{error:errorMessage,errorCode,isTableMissing,userSiteAccessExists:!!userSiteAccess},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (isTableMissing) {
          throw new ValidationError('user_site_access table does not exist. Please run database migrations first.');
        }
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      data: newUser,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
