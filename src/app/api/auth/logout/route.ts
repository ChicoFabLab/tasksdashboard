/**
 * Logout API - Clears PocketBase Authentication
 * 
 * This endpoint logs the user out by clearing the PocketBase auth token.
 * Since authentication is handled by PocketBase, clearing the token
 * effectively logs the user out.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Clear PocketBase authentication token
  // This logs the user out of PocketBase
  cookieStore.delete('pb_auth');
  
  // Also clear session metadata (for UI)
  cookieStore.delete('volunteer_session');
  
  return NextResponse.json({ success: true });
}


