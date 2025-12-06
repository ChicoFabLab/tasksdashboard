import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { cookies } from 'next/headers';
import type { VolunteerHours } from '@/lib/pocketbase';

/**
 * GET /api/volunteer-hours - List volunteer hours
 * POST /api/volunteer-hours - Create new volunteer hours entry
 */

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('volunteer_session');
  const pbAuthCookie = cookieStore.get('pb_auth');
  
  // Authenticate PocketBase if token is available
  if (pbAuthCookie) {
    try {
      pb.authStore.save(pbAuthCookie.value, null);
      // Verify token is valid
      await pb.collection('volunteers').authRefresh();
    } catch (err) {
      console.warn('[Volunteer Hours API] PocketBase token invalid:', err);
      pb.authStore.clear();
    }
  }
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.volunteerId) {
      return NextResponse.json({
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const volunteerId = searchParams.get('volunteerId') || session.volunteerId;

    let filter = '';
    if (volunteerId) {
      filter = `volunteer = "${volunteerId}"`;
    }

    const hours = await pb.collection('volunteer_hours').getFullList<VolunteerHours>({
      filter,
      sort: '-date',
    });
    
    return NextResponse.json({ hours });
  } catch (error: any) {
    console.error('Error fetching volunteer hours:', error);
    return NextResponse.json({
      error: 'Failed to fetch volunteer hours',
      message: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.volunteerId) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to create hours entries',
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.description || !body.hours || !body.date) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Description, hours, and date are required',
      }, { status: 400 });
    }
    
    const hoursData = {
      volunteer: body.volunteer || session.volunteerId,
      task: body.task || null,
      description: body.description,
      hours: parseFloat(body.hours),
      date: body.date,
      created_by: session.volunteerId,
    };
    
    const hours = await pb.collection('volunteer_hours').create<VolunteerHours>(hoursData);
    
    return NextResponse.json({ 
      success: true,
      hours,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating volunteer hours:', error);
    return NextResponse.json({
      error: 'Failed to create volunteer hours',
      message: error.message,
    }, { status: 500 });
  }
}

