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
    const volunteerId = session.volunteerId;

    if (!volunteerId) {
      return NextResponse.json(
        { error: 'Volunteer ID not found in session' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const photos = formData.getAll('photos') as File[];

    if (!title || !description || photos.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create PocketBase instance and authenticate as admin
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    // Authenticate as admin to create creations
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    
    // Get volunteer record to verify it exists
    let volunteer;
    try {
      volunteer = await pb.collection('volunteers').getOne(volunteerId);
    } catch (volunteerError: any) {
      console.error('Failed to fetch volunteer:', volunteerError);
      return NextResponse.json(
        { error: 'Volunteer not found' },
        { status: 404 }
      );
    }

    // Get board from volunteer record or default to 'main'
    const volunteerBoard = (volunteer as { board?: string }).board || 'main';

    // Create FormData for PocketBase
    const pbFormData = new FormData();
    pbFormData.append('volunteer', volunteerId);
    pbFormData.append('title', title);
    pbFormData.append('description', description);
    pbFormData.append('board', volunteerBoard);

    // Add all photos
    photos.forEach((file) => {
      pbFormData.append('photos', file);
    });

    // Create the creation record
    console.log('Creating creation with data:', {
      volunteer: volunteerId,
      title,
      description,
      photoCount: photos.length
    });
    
    const creation = await pb.collection('creations').create(pbFormData);
    console.log('Creation created successfully:', creation.id);

    return NextResponse.json(creation);
  } catch (error: any) {
    console.error('Error creating creation:', error);
    console.error('Error status:', error.status);
    console.error('Error response:', error.response);
    console.error('Error data:', error.data);
    
    // PocketBase ClientResponseError structure
    // error.data contains the validation errors
    // error.response.data might also have it
    const pbErrorData = error.data || error.response?.data || {};
    console.error('PocketBase error data:', JSON.stringify(pbErrorData, null, 2));
    
    // Extract field-specific validation errors
    // PocketBase returns errors like: { volunteer: { message: "..." }, title: { message: "..." } }
    let errorMessage = pbErrorData.message || error.message || 'Failed to create creation';
    const fieldErrors: Record<string, string> = {};
    
    // PocketBase returns field errors as nested objects
    if (pbErrorData && typeof pbErrorData === 'object') {
      Object.keys(pbErrorData).forEach(key => {
        if (key !== 'message' && key !== 'code') {
          const fieldError = pbErrorData[key];
          if (typeof fieldError === 'object' && fieldError.message) {
            fieldErrors[key] = fieldError.message;
          } else if (typeof fieldError === 'string') {
            fieldErrors[key] = fieldError;
          } else {
            fieldErrors[key] = JSON.stringify(fieldError);
          }
        }
      });
    }
    
    // Build detailed error message
    if (Object.keys(fieldErrors).length > 0) {
      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      errorMessage = `${errorMessage} - Field errors: ${fieldErrorMessages}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: pbErrorData,
        fieldErrors: fieldErrors,
        debug: {
          status: error.status,
          message: error.message,
          hasData: !!error.data,
          hasResponse: !!error.response,
          dataKeys: error.data ? Object.keys(error.data) : [],
        }
      },
      { status: error.status || 500 }
    );
  }
}

