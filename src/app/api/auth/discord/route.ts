/**
 * Discord OAuth Login - Initiates OAuth2 Flow
 * 
 * This endpoint redirects to Discord's OAuth2 endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const base_url = process.env.NEXT_PUBLIC_BASE_URL!;
  
  const redirectUri = `${base_url}/api/auth/discord/callback`;

  // Generate random state for security
  const state = Math.random().toString(36).substring(7);

  // Construct Discord OAuth URL
  const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
  discordAuthUrl.searchParams.set('client_id', clientId);
  discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
  discordAuthUrl.searchParams.set('response_type', 'code');
  discordAuthUrl.searchParams.set('scope', 'identify email');
  discordAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(discordAuthUrl.toString());
}

