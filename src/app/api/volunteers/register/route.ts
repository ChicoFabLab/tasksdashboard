import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';
import crypto from 'crypto';

/**
 * Server-side volunteer registration endpoint
 * Creates volunteer with auto-generated password so they can authenticate with PocketBase
 * 
 * This allows API rules to properly check @request.auth.id
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('volunteer_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Get form data
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const discordId = formData.get('discord_id') as string;
    const photoBlob = formData.get('profile_photo') as File;

    if (!username || !email || !discordId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create PocketBase instance with admin auth (to create volunteer)
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Authenticate as admin to create volunteer
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );

    // Generate a secure random password for the volunteer
    // They'll never see this - it's just for PocketBase authentication
    const password = crypto.randomBytes(32).toString('hex');

    // Create volunteer with password
    const pbFormData = new FormData();
    pbFormData.append('username', username);
    pbFormData.append('email', email);
    pbFormData.append('discord_id', discordId);
    pbFormData.append('password', password);
    pbFormData.append('passwordConfirm', password);
    if (photoBlob) {
      pbFormData.append('profile_photo', photoBlob);
    }
    pbFormData.append('total_minutes', '0');

    const newVolunteer = await pb.collection('volunteers').create(pbFormData);

    // Now authenticate as the volunteer to get auth token
    // Create a new PB instance for volunteer auth
    const volunteerPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    await volunteerPb.collection('volunteers').authWithPassword(email, password);
    const authToken = volunteerPb.authStore.token;
    const authRecord = volunteerPb.authStore.record;

    if (!authToken || !authRecord) {
      throw new Error('Failed to authenticate volunteer after creation');
    }

    // Update session with volunteer ID and PocketBase auth token
    const updatedSession = {
      ...session,
      volunteerId: newVolunteer.id,
      pbToken: authToken,
      needsRegistration: false
    };

    cookieStore.set('volunteer_session', JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      volunteer: {
        id: newVolunteer.id,
        username: newVolunteer.username,
        email: newVolunteer.email
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Registration failed',
        details: error.response?.data || error.data
      },
      { status: error.status || 500 }
    );
  }
}

