import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticateAdmin() {
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
}

// POST /api/completions - Complete a task with multiple volunteers
export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin();

    const body = await request.json();
    const { taskId, volunteerIds, minutesPerVolunteer, note } = body;

    if (!taskId || !volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task ID and volunteer IDs are required' },
        { status: 400 }
      );
    }

    console.log('Completing task:', taskId, 'for volunteers:', volunteerIds);

    // Fetch all volunteers first to get current total_minutes
    const volunteers = await Promise.all(
      volunteerIds.map(id => pb.collection('volunteers').getOne(id))
    );

    // Create completion records and update volunteers SEQUENTIALLY to avoid race conditions
    const completions = [];
    for (let i = 0; i < volunteerIds.length; i++) {
      const volId = volunteerIds[i];
      const volunteer = volunteers[i];
      
      try {
        // Create completion record
        const completion = await pb.collection('completions').create({
          task: taskId,
          volunteer: volId,
          actual_minutes: minutesPerVolunteer,
          completion_note: note || 'Completed successfully',
        });
        completions.push(completion);

        // Update volunteer total minutes
        await pb.collection('volunteers').update(volId, {
          total_minutes: (volunteer.total_minutes || 0) + minutesPerVolunteer,
        });
        
        console.log(`✅ Completion record created for volunteer ${i + 1}/${volunteerIds.length}`);
      } catch (err: any) {
        console.error(`❌ Error creating completion for volunteer ${volId}:`, err);
        throw new Error(`Failed to create completion for volunteer ${i + 1}: ${err.message}`);
      }
    }

    // Update task status to completed AFTER all completions are created
    const updatedTask = await pb.collection('tasks').update(taskId, {
      status: 'completed',
    });

    console.log('✅ Task completed successfully:', taskId);

    return NextResponse.json({
      success: true,
      completions,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error('❌ Error completing task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to complete task',
        details: error.data || null,
      },
      { status: 500 }
    );
  }
}


