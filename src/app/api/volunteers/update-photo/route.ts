import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    // Get session to verify authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('volunteer_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const sessionVolunteerId = session.volunteerId;

    if (!sessionVolunteerId) {
      return NextResponse.json(
        { error: 'Volunteer ID not found in session' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const volunteerId = formData.get('volunteerId') as string;
    const photo = formData.get('photo') as File;

    // Verify the user is updating their own profile
    if (volunteerId !== sessionVolunteerId) {
      return NextResponse.json(
        { error: 'You can only update your own profile photo' },
        { status: 403 }
      );
    }

    if (!photo) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Create PocketBase instance and authenticate as admin
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    // Update volunteer profile photo
    const updateFormData = new FormData();
    updateFormData.append('profile_photo', photo);

    const updatedVolunteer = await pb.collection('volunteers').update(volunteerId, updateFormData);

    console.log('✅ Profile photo updated successfully for volunteer:', volunteerId);

    return NextResponse.json({
      success: true,
      volunteer: updatedVolunteer,
    });
  } catch (error: any) {
    console.error('❌ Error updating profile photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile photo',
        details: error.data || null,
      },
      { status: 500 }
    );
  }
}


