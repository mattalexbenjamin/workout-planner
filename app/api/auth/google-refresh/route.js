import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    if (clientId) bodyParams.append('client_id', clientId);
    if (clientSecret) bodyParams.append('client_secret', clientSecret);

    const googleRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    const data = await googleRes.json();

    if (!googleRes.ok || !data.access_token) {
      console.warn('Google token refresh failed:', data);
      return NextResponse.json(
        { error: data.error_description || data.error || 'Failed to refresh Google access token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
    });
  } catch (err) {
    console.error('Error in google-refresh route:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
