import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticateAdmin() {
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
}

// GET: Fetch goal progress for a volunteer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const volunteerId = searchParams.get('volunteerId');
    const goalId = searchParams.get('goalId');

    if (!volunteerId) {
      return NextResponse.json(
        { error: 'volunteerId is required' },
        { status: 400 }
      );
    }

    await authenticateAdmin();

    if (goalId) {
      // Get progress for specific goal
      try {
        const progress = await pb.collection('goal_progress').getFirstListItem(
          `volunteer = "${volunteerId}" && goal = "${goalId}"`
        );
        return NextResponse.json({ progress });
      } catch (err: any) {
        if (err.status === 404) {
          // No progress yet
          return NextResponse.json({ progress: null });
        }
        throw err;
      }
    } else {
      // Get all progress for volunteer
      const progressList = await pb.collection('goal_progress').getFullList({
        filter: `volunteer = "${volunteerId}"`,
        expand: 'goal'
      });
      return NextResponse.json({ progressList });
    }
  } catch (error: any) {
    console.error('Error fetching goal progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch goal progress' },
      { status: 500 }
    );
  }
}

// POST: Create or update goal progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { volunteerId, goalId, completedSteps, isCompleted, completedAt } = body;

    if (!volunteerId || !goalId) {
      return NextResponse.json(
        { error: 'volunteerId and goalId are required' },
        { status: 400 }
      );
    }

    await authenticateAdmin();

    // Check if progress already exists
    let existingProgress;
    try {
      existingProgress = await pb.collection('goal_progress').getFirstListItem(
        `volunteer = "${volunteerId}" && goal = "${goalId}"`
      );
    } catch (err: any) {
      if (err.status !== 404) {
        throw err;
      }
    }

    const progressData = {
      volunteer: volunteerId,
      goal: goalId,
      completed_steps: completedSteps || [],
      is_completed: isCompleted || false,
      completed_at: completedAt || null
    };

    let progress;
    if (existingProgress) {
      // Update existing
      progress = await pb.collection('goal_progress').update(existingProgress.id, progressData);
    } else {
      // Create new
      progress = await pb.collection('goal_progress').create(progressData);
    }

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error: any) {
    console.error('Error saving goal progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save goal progress' },
      { status: 500 }
    );
  }
}

