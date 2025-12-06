import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const taskNumber = searchParams.get('taskNumber');

  // Store taskNumber in the state parameter
  const state = JSON.stringify({
    taskNumber,
    timestamp: Date.now(),
  });

  const encodedState = Buffer.from(state).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/discord/callback`,
    response_type: 'code',
    scope: 'identify email guilds guilds.members.read',
    state: encodedState,
    // Mobile-optimized: prompt for app selection on mobile
    prompt: 'none',
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
