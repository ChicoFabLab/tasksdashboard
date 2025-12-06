import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { cookies } from 'next/headers';
import type { Goal } from '@/lib/pocketbase';

/**
 * GET /api/goals/[id] - Get single goal
 * PATCH /api/goals/[id] - Update goal (creator only, no SBU goals)
 * DELETE /api/goals/[id] - Delete goal (creator only, no SBU goals)
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const goal = await pb.collection('goals').getOne<Goal>(id);
    
    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({
      error: 'Goal not found',
      message: error.message,
    }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check authentication
    const session = await getSession();
    if (!session || !session.volunteerId) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to edit goals',
      }, { status: 401 });
    }
    
    // Get existing goal
    const existingGoal = await pb.collection('goals').getOne<Goal>(id);
    
    // Check if it's an SBU goal (protected)
    if (existingGoal.is_sbu) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'SBU goals cannot be edited by regular users',
      }, { status: 403 });
    }
    
    // Check if user is the creator
    if (existingGoal.created_by !== session.volunteerId) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'You can only edit goals you created',
      }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Update goal (don't allow changing is_sbu, created_by, or board)
    const updateData: Partial<Goal> = {};
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.difficulty) updateData.difficulty = body.difficulty;
    if (body.estimated_minutes) updateData.estimated_minutes = body.estimated_minutes;
    if (body.icon) updateData.icon = body.icon;
    if (body.zone_leader !== undefined) updateData.zone_leader = body.zone_leader;
    if (body.sbu_schedule !== undefined) updateData.sbu_schedule = body.sbu_schedule;
    if (body.steps) updateData.steps = body.steps;
    if (body.prerequisites) updateData.prerequisites = body.prerequisites;
    // Preserve board field (don't allow changing board)
    updateData.board = existingGoal.board || 'main';
    
    const updated = await pb.collection('goals').update<Goal>(id, updateData);
    
    return NextResponse.json({ 
      success: true,
      goal: updated,
    });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return NextResponse.json({
      error: 'Failed to update goal',
      message: error.message,
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Check authentication
    const session = await getSession();
    if (!session || !session.volunteerId) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to delete goals',
      }, { status: 401 });
    }
    
    // Get existing goal
    const existingGoal = await pb.collection('goals').getOne<Goal>(id);
    
    // Check if it's an SBU goal (protected)
    if (existingGoal.is_sbu) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'SBU goals cannot be deleted',
      }, { status: 403 });
    }
    
    // Check if user is the creator
    if (existingGoal.created_by !== session.volunteerId) {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'You can only delete goals you created',
      }, { status: 403 });
    }
    
    await pb.collection('goals').delete(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({
      error: 'Failed to delete goal',
      message: error.message,
    }, { status: 500 });
  }
}

