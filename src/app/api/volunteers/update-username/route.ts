import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { volunteerId, username } = body;

    if (!volunteerId || !username) {
      return NextResponse.json(
        { error: 'volunteerId and username are required' },
        { status: 400 }
      );
    }

    // Get session from cookie to verify user is authenticated
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('volunteer_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!session.volunteerId || session.volunteerId !== volunteerId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only update your own username.' },
        { status: 403 }
      );
    }

    // Use admin PocketBase instance to update (since we're server-side)
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    const adminPb = new PocketBase(pbUrl);
    
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error('Missing PocketBase admin credentials');
      return NextResponse.json(
        { error: 'Server configuration error: Missing admin credentials' },
        { status: 500 }
      );
    }

    try {
      await adminPb.admins.authWithPassword(adminEmail, adminPassword);
    } catch (authError: any) {
      console.error('Failed to authenticate as admin:', authError);
      return NextResponse.json(
        { error: 'Server authentication error' },
        { status: 500 }
      );
    }

    // Update username
    try {
      const updated = await adminPb.collection('volunteers').update(volunteerId, {
        username: username.trim()
      });

      return NextResponse.json({
        success: true,
        volunteer: updated
      });
    } catch (updateError: any) {
      console.error('Failed to update volunteer:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update username' },
        { status: updateError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error updating username:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update username' },
      { status: 500 }
    );
  }
}

