/**
 * Discord Task Completion Notification API
 * Sends task completion announcements to Discord channel
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordMessage, formatTaskCompletion } from '@/lib/discord';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskData, volunteerNames, actualMinutes, totalMinutes } = body;

    // Get Discord channel from environment variable
    const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
    if (!channelId) {
      throw new Error('DISCORD_ANNOUNCEMENTS_CHANNEL_ID not configured');
    }

    // Build task URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;

    // Format and send Discord announcement
    const announcement = formatTaskCompletion({
      task_number: taskData.task_number,
      title: taskData.title,
      description: taskData.description,
      zone: taskData.zone,
      completed_by_names: volunteerNames,
      actual_minutes: actualMinutes,
      total_minutes: totalMinutes, // Total aggregate time if multiple volunteers
      task_url: taskUrl,
    });

    const result = await sendDiscordMessage(channelId, announcement);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      channelId: result.channel_id,
    });
  } catch (error: any) {
    console.error('Failed to send Discord completion notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send Discord notification',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

