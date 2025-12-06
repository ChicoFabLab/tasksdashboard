import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('volunteer_session');

  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();

    // Update session with new data
    const updatedSession = {
      ...session,
      ...body,
      needsRegistration: false,
    };

    cookieStore.set('volunteer_session', JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
