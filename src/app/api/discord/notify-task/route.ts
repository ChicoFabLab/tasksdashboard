/**
 * Discord Task Notification API
 * Sends task announcements to Discord channel
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordMessage, formatTaskAnnouncement } from '@/lib/discord';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskData, createdById } = body;

    // Get Discord channel from environment variable
    const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
    if (!channelId) {
      throw new Error('DISCORD_ANNOUNCEMENTS_CHANNEL_ID not configured');
    }

    // Initialize PocketBase to get creator name
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090');
    
    let createdByName = 'Unknown';
    try {
      const volunteer = await pb.collection('volunteers').getOne(createdById);
      createdByName = volunteer.username || volunteer.email || 'Unknown';
    } catch (err) {
      console.warn('Could not fetch creator info:', err);
    }

    // Build task URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;

    // Build image URL if exists
    let imageUrl: string | undefined;
    if (taskData.image) {
      const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
      imageUrl = `${pbUrl}/api/files/tasks/${taskId}/${taskData.image}`;
    }

    // Format and send Discord announcement
    const announcement = formatTaskAnnouncement({
      task_number: taskData.task_number,
      title: taskData.title,
      description: taskData.description,
      zone: taskData.zone,
      estimated_minutes: taskData.estimated_minutes,
      created_by_name: createdByName,
      task_url: taskUrl,
      image_url: imageUrl,
    });

    const result = await sendDiscordMessage(channelId, announcement);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      channelId: result.channel_id,
    });
  } catch (error: any) {
    console.error('Failed to send Discord notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send Discord notification',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

