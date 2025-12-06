/**
 * Session API - Returns PocketBase Authentication Status
 * 
 * This endpoint checks if the user is authenticated with PocketBase.
 * Authentication is handled entirely by PocketBase, not the website.
 * 
 * Returns:
 * - pbToken: PocketBase authentication token (if authenticated)
 * - volunteer: PocketBase volunteer record (if authenticated)
 * - isAuthenticated: Whether user is authenticated with PocketBase
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('volunteer_session');

  // Check volunteer_session cookie first - this is the main auth mechanism
  if (!sessionCookie) {
    return NextResponse.json({ 
      session: null,
      pbToken: null,
      isAuthenticated: false,
    });
  }

  try {
    // Parse the session data
    const sessionData = JSON.parse(sessionCookie.value);
    
    // If we have a volunteerId in the session, user is authenticated
    if (sessionData.volunteerId) {
      return NextResponse.json({ 
        session: sessionData,
        volunteerId: sessionData.volunteerId,
        isAuthenticated: true,
        pbToken: null, // Not used for regular operations
      });
    }

    // No volunteerId means not authenticated
    return NextResponse.json({ 
      session: null,
      pbToken: null,
      isAuthenticated: false,
    });
  } catch (error) {
    console.error('[Session API] Error parsing session:', error);
    return NextResponse.json({ 
      session: null,
      pbToken: null,
      isAuthenticated: false,
    });
  }
}
