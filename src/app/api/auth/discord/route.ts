/**
 * Discord OAuth Login - Initiates PocketBase OAuth2 Flow
 * 
 * This endpoint redirects to PocketBase's OAuth2 endpoint, which handles
 * Discord authentication directly. PocketBase manages the entire OAuth flow.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get('callbackUrl') || '/volunteer/tasks';
  
  // Redirect to PocketBase OAuth2 endpoint
  // PocketBase will handle the Discord OAuth flow
  const oauthUrl = `${pbUrl}/api/oauth2-redirect?provider=discord&url=${encodeURIComponent(callbackUrl)}`;
  
  return NextResponse.redirect(oauthUrl);
}

