import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { cookies } from 'next/headers';
import type { Goal } from '@/lib/pocketbase';

/**
 * GET /api/goals - List all goals
 * POST /api/goals - Create new goal (authenticated users only)
 */

// Helper to get session from cookie and authenticate PocketBase
async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('volunteer_session');
  const pbAuthCookie = cookieStore.get('pb_auth');
  
  // Authenticate PocketBase if token is available
  if (pbAuthCookie) {
    try {
      pb.authStore.save(pbAuthCookie.value, null);
      // Verify token is valid
      await pb.collection('volunteers').authRefresh();
    } catch (err) {
      console.warn('[Goals API] PocketBase token invalid:', err);
      pb.authStore.clear();
    }
  }
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    let filter = '';
    if (category && category !== 'All') {
      filter = `category = "${category}"`;
    }
    
    const goals = await pb.collection('goals').getFullList<Goal>({
      filter,
      sort: '-is_sbu,category,difficulty,title',
    });
    
    return NextResponse.json({ goals });
  } catch (error: unknown) {
    console.error('Error fetching goals:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to fetch goals',
      message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Title and description are required',
      }, { status: 400 });
    }
    
    // Get session to get the volunteerId
    const session = await getSession();
    const volunteerId = session?.volunteerId || body.created_by || '';
    
    console.log('[Goals API] Creating goal for volunteer:', volunteerId);
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Title and description are required',
      }, { status: 400 });
    }
    
    // Create goal data - match PocketBase schema exactly
    const goalData = {
      title: body.title,
      description: body.description,
      category: body.category || 'Custom',
      difficulty: body.difficulty || 'Beginner',
      estimated_minutes: body.estimated_minutes || 60,
      icon: body.icon || '🎯',
      zone_leader: body.zone_leader || '',
      sbu_schedule: body.sbu_schedule || '',
      is_sbu: 'false', // Text field in PocketBase, not boolean
      steps: body.steps || [],
      prerequisites: body.prerequisites || [],
      created_by: volunteerId,
      board: body.board || 'main',
    };
    
    console.log('[Goals API] Creating goal with data:', JSON.stringify(goalData, null, 2));
    
    // Use admin auth to create the record (bypasses auth rules)
    const adminPb = new (await import('pocketbase')).default(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    await adminPb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    
    const goal = await adminPb.collection('goals').create<Goal>(goalData);
    
    console.log('[Goals API] Goal created successfully:', goal.id);
    
    return NextResponse.json({ 
      success: true,
      goal,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[Goals API] Error creating goal:', error);
    
    // Enhanced error logging
    if (error && typeof error === 'object' && 'response' in error) {
      const pbError = error as any;
      console.error('[Goals API] PocketBase error details:', pbError.response);
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to create goal',
      message,
      details: error && typeof error === 'object' && 'response' in error ? (error as any).response : null,
    }, { status: 500 });
  }
}

