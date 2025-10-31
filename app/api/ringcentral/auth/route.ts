import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET() {
  const CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
  const CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
  const JWT_TOKEN = process.env.RINGCENTRAL_JWT;

  // Return error if credentials are not configured
  if (!CLIENT_ID || !CLIENT_SECRET || !JWT_TOKEN) {
    return NextResponse.json(
      { error: 'RingCentral credentials not configured' },
      { status: 503 }
    );
  }
  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://platform.ringcentral.com/restapi/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${JWT_TOKEN}`
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'Authentication failed', details: error }, { status: 401 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
