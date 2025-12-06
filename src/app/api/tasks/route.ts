import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticateAdmin() {
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin();

    const formData = await request.formData();
    
    console.log('Creating task with data:', Object.fromEntries(formData));

    // Create the task using admin auth
    const newTask = await pb.collection('tasks').create(formData);

    console.log('✅ Task created successfully:', newTask.id);

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (error: any) {
    console.error('❌ Error creating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create task',
        details: error.data || null,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks?id=xxx - Update a task
export async function PATCH(request: NextRequest) {
  try {
    await authenticateAdmin();

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    console.log('Updating task', taskId, 'with data:', Object.fromEntries(formData));

    // Update the task using admin auth
    const updatedTask = await pb.collection('tasks').update(taskId, formData);

    console.log('✅ Task updated successfully:', updatedTask.id);

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error('❌ Error updating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update task',
        details: error.data || null,
      },
      { status: 500 }
    );
  }
}

