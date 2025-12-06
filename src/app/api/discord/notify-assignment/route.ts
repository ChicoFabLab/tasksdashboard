/**
 * Discord Task Assignment DM API
 * Sends DM to volunteer when assigned a task
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendDirectMessage, formatTaskAssignment } from '@/lib/discord';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskData, volunteerId } = body;

    console.log('[Discord Assignment] Starting DM notification for volunteer:', volunteerId);

    // Initialize PocketBase to get volunteer Discord ID
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090');
    
    let discordId: string | null = null;
    try {
      const volunteer = await pb.collection('volunteers').getOne(volunteerId);
      discordId = volunteer.discord_id;
      
      console.log('[Discord Assignment] Volunteer Discord ID:', discordId);
      
      if (!discordId) {
        console.warn('[Discord Assignment] Volunteer has no Discord ID, skipping DM');
        return NextResponse.json({
          success: false,
          error: 'Volunteer has no Discord ID',
        });
      }
    } catch (err) {
      console.error('[Discord Assignment] Could not fetch volunteer info:', err);
      return NextResponse.json({
        success: false,
        error: 'Could not fetch volunteer',
      }, { status: 400 });
    }

    // Check if bot token is configured
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[Discord Assignment] DISCORD_BOT_TOKEN not configured!');
      return NextResponse.json({
        success: false,
        error: 'Bot token not configured',
      }, { status: 500 });
    }

    console.log('[Discord Assignment] Bot token configured:', botToken.substring(0, 20) + '...');

    // Build task URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;

    console.log('[Discord Assignment] Task URL:', taskUrl);

    // Format and send Discord DM
    const dmMessage = formatTaskAssignment({
      task_number: taskData.task_number,
      title: taskData.title,
      description: taskData.description,
      zone: taskData.zone,
      estimated_minutes: taskData.estimated_minutes,
      task_url: taskUrl,
    });

    console.log('[Discord Assignment] Sending DM to Discord ID:', discordId);

    const result = await sendDirectMessage(discordId, dmMessage);

    console.log('[Discord Assignment] DM sent successfully! Message ID:', result.id);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      discordId: discordId,
    });
  } catch (error: any) {
    console.error('[Discord Assignment] Failed to send Discord assignment DM:', error);
    console.error('[Discord Assignment] Error details:', error.message);
    if (error.response) {
      const errorText = await error.response.text().catch(() => 'Could not read error response');
      console.error('[Discord Assignment] Discord API response:', errorText);
    }
    return NextResponse.json(
      {
        error: 'Failed to send Discord DM',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

