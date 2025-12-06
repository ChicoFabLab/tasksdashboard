import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const encodedState = searchParams.get('state');

  if (!code || !encodedState) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/volunteer/register?error=missing_code`
    );
  }

  try {
    // Decode state to get taskNumber
    const state = JSON.parse(Buffer.from(encodedState, 'base64url').toString());
    const taskNumber = state.taskNumber;

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/discord/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    const discordId = userData.id;
    const username = userData.username;
    const email = userData.email || `${discordId}@discord.user`;

    // Check for existing volunteer
    let volunteer;
    try {
      volunteer = await pb.collection('volunteers').getFirstListItem(`discord_id = "${discordId}"`);
    } catch {
      try {
        volunteer = await pb.collection('volunteers').getFirstListItem(`email = "${email}"`);
        // Update with discord_id
        await pb.collection('volunteers').update(volunteer.id, {
          discord_id: discordId,
        });
      } catch {
        volunteer = null;
      }
    }

    if (volunteer) {
      // Existing volunteer - get task and redirect to tracking
      const task = await pb.collection('tasks').getFirstListItem(`task_number = "${taskNumber}"`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/volunteer/track?taskId=${task.id}&volunteerId=${volunteer.id}`
      );
    } else {
      // New volunteer - redirect to photo upload with Discord info in URL
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/volunteer/register?step=photo&taskNumber=${taskNumber}&discordId=${discordId}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`
      );
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/volunteer/register?error=auth_failed`
    );
  }
}
