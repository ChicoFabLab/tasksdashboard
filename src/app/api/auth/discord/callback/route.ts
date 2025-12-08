/**
 * Direct Discord OAuth Callback Handler
 * 
 * Flow:
 * 1. User clicks login → App redirects to Discord
 * 2. Discord redirects back here with code
 * 3. We exchange code for Discord token
 * 4. We fetch Discord user info
 * 5. We create/update PocketBase user
 */
import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

function generateInsecurePassword(length = 16) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";

    for (let i = 0; i < length; i++) {
        password += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return password;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    console.error('[Discord Callback] No code parameter received');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/discord?error=missing_code`
    );
  }

  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    // Exchange code for Discord access token
    console.log('[Discord Callback] Exchanging code for token...');
    
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/discord/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Discord Callback] Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Discord user information
    console.log('[Discord Callback] Fetching Discord user info...');
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    const discordId = userData.id;
    const discordUsername = userData.username; // Discord username
    const email = userData.email || `${discordId}@discord.user`;

    console.log('[Discord Callback] Got Discord user data:', {
      discordId,
      discordUsername,
      email,
    });

    // Create or update volunteer in PocketBase using admin credentials
    const adminPb = new PocketBase(pbUrl);
    await adminPb.collection('_superusers').authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    // Check if volunteer exists by discord_id
    let volunteer;
    try {
      volunteer = await adminPb.collection('volunteers').getFirstListItem(`discord_id = "${discordId}"`);
      
      // Update existing volunteer with latest Discord data
      console.log('[Discord Callback] Updating existing volunteer:', volunteer.id);
      await adminPb.collection('volunteers').update(volunteer.id, {
        discord_username: discordUsername,
        email: email,
      });
      
      volunteer = await adminPb.collection('volunteers').getOne(volunteer.id);
    } catch (error) {
      let password = generateInsecurePassword();
      // Volunteer doesn't exist, create new one
      console.log('[Discord Callback] Creating new volunteer');
      volunteer = await adminPb.collection('volunteers').create({
        discord_id: discordId,
        discord_username: discordUsername,
        username: discordUsername,
        email: email,
        total_minutes: 0,
        password: password,
        passwordConfirm: password,
      });
    }

    console.log('[Discord Callback] Volunteer ready:', {
      id: volunteer.id,
      discord_id: volunteer.discord_id,
      discord_username: volunteer.discord_username,
      email: volunteer.email,
    });

    // Authenticate the user (create a fake token for the session)
    // Since we're using admin, we need to create a session cookie manually
    const cookieStore = await cookies();
    
    // Store session metadata
    const sessionData = {
      volunteerId: volunteer.id,
      email: volunteer.email,
      username: volunteer.username || discordUsername,
      discord_id: volunteer.discord_id,
      discord_username: volunteer.discord_username,
      needsRegistration: false,
    };

    cookieStore.set('volunteer_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // For PocketBase API calls, we need to authenticate as the user
    const userPb = new PocketBase(pbUrl);
    try {
      // Authenticate as the volunteer using their email and a generated password
      // Since volunteers are created via admin, they don't have passwords
      // We need to use admin auth token for API calls
      // Instead, we'll pass the admin token for server-side operations
      
      // Actually, let's authenticate the volunteer properly by setting a password
      // if they don't have one, or use OAuth2 auth from PocketBase
      
      // For now, use the admin PB instance's token for API calls
      cookieStore.set('pb_auth', adminPb.authStore.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      
      console.log('[Discord Callback] Set pb_auth cookie with admin token');
    } catch (e) {
      console.error('[Discord Callback] Failed to set pb_auth:', e);
    }

    // Redirect to dashboard
    const redirectTo = `/volunteer/tasks?id=${volunteer.id}`;
    console.log('[Discord Callback] Redirecting to:', redirectTo);

    return NextResponse.redirect(`${baseUrl}${redirectTo}`);
    
  } catch (error) {
    console.error('[OAuth Callback] Authentication error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/discord?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
