import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { saveSocialMediaConnection } from '@/services/socialMediaService';
import { getAuthenticatedUser, getUserIdFromCookies } from '@/lib/auth/server-auth';

// Exchange a short-lived token for a long-lived one and get user profile
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    let userId = authenticatedUser?.uid;
    
    // Fallback authentication methods
    if (!userId) {
      userId = getUserIdFromCookies(request);
    }
    
    if (!userId && auth.currentUser) {
      userId = auth.currentUser.uid;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse the request body to get the Facebook access token
    const body = await request.json();
    const { accessToken, userID } = body;
    
    if (!accessToken || !userID) {
      return NextResponse.json(
        { error: 'Missing access token or user ID' },
        { status: 400 }
      );
    }

    // Get app credentials
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Missing Facebook app credentials' },
        { status: 500 }
      );
    }
    
    console.log('Exchanging short-lived token for long-lived token');
    
    // Exchange the short-lived token for a long-lived one
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v17.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${accessToken}`,
      { method: 'GET' }
    );
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Failed to exchange token:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange token' },
        { status: 500 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    const longLivedToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;
    
    console.log('Getting user profile');
    
    // Get user profile information
    const profileResponse = await fetch(
      `https://graph.facebook.com/v17.0/me?fields=id,name&access_token=${longLivedToken}`,
      { method: 'GET' }
    );
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('Failed to get profile:', errorData);
      return NextResponse.json(
        { error: 'Failed to get profile' },
        { status: 500 }
      );
    }
    
    const profileData = await profileResponse.json();
    
    console.log('Saving connection');
    
    // Save the connection to the database
    await saveSocialMediaConnection(userId, 'facebook', {
      accessToken: longLivedToken,
      refreshToken: null, // Facebook doesn't use refresh tokens
      expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined,
      profileId: profileData.id,
      profileName: profileData.name,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Facebook account connected successfully',
    });
  } catch (error) {
    console.error('Error handling Facebook token:', error);
    return NextResponse.json(
      { error: 'Failed to process Facebook authentication' },
      { status: 500 }
    );
  }
} 