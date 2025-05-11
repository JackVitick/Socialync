import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/config';
import { saveSocialMediaConnection } from '@/services/socialMediaService';
import { PlatformID } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

// Map of environment variable names for each platform
const ENV_VAR_MAP = {
  facebook: {
    clientId: 'FACEBOOK_APP_ID',
    clientSecret: 'FACEBOOK_APP_SECRET'
  },
  instagram: {
    clientId: 'INSTAGRAM_APP_ID',
    clientSecret: 'INSTAGRAM_APP_SECRET'
  },
  twitter: {
    clientId: 'TWITTER_API_KEY',
    clientSecret: 'TWITTER_API_SECRET_KEY'
  },
  tiktok: {
    clientId: 'TIKTOK_API_KEY',
    clientSecret: 'TIKTOK_APP_SECRET'
  },
  youtube: {
    clientId: 'YOUTUBE_CLIENT_ID',
    clientSecret: 'YOUTUBE_CLIENT_SECRET'
  }
};

// Define the OAuth token exchange URLs for each platform
const OAUTH_PROVIDERS = {
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v16.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/v16.0/me?fields=id,name',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
  },
  instagram: {
    // Instagram uses Facebook's OAuth
    tokenUrl: 'https://graph.facebook.com/v16.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/v16.0/me/accounts',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
  },
  tiktok: {
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    profileUrl: 'https://open-api.tiktok.com/oauth/userinfo/',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
  },
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  console.log(`OAuth callback for platform: ${params.platform}`);
  
  // Get the platform from route parameters
  const platform = params.platform as PlatformID;
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Check for errors from OAuth provider
  if (error) {
    console.error(`OAuth error from ${platform}: ${error}`);
    return NextResponse.redirect(
      new URL(`/connections?error=oauth_${platform}_${error}`, request.url)
    );
  }
  
  // Validate required params
  if (!code || !state) {
    console.error(`Missing required OAuth params for ${platform}: code=${code}, state=${state}`);
    return NextResponse.redirect(
      new URL('/connections?error=invalid_oauth_response', request.url)
    );
  }
  
  // Validate state to prevent CSRF
  const storedState = request.cookies.get('oauth_state')?.value;
  const storedPlatform = request.cookies.get('platform')?.value;
  const userId = request.cookies.get('user_id')?.value;
  
  console.log({
    storedState,
    storedPlatform,
    userId,
    receivedState: state,
    receivedPlatform: platform
  });
  
  if (!storedState || state !== storedState || platform !== storedPlatform || !userId) {
    console.error(`Invalid OAuth state: stored=${storedState}, received=${state}, platform=${platform}, storedPlatform=${storedPlatform}`);
    return NextResponse.redirect(
      new URL('/connections?error=invalid_oauth_state', request.url)
    );
  }
  
  try {
    // Verify environment variables are set
    const envVars = ENV_VAR_MAP[platform];
    if (!process.env[envVars.clientId] || !process.env[envVars.clientSecret]) {
      console.error(`Missing environment variables for ${platform}`);
      return NextResponse.redirect(
        new URL(`/connections?error=missing_config_for_${platform}`, request.url)
      );
    }
    
    // Exchange code for token
    console.log(`Exchanging code for token for ${platform}`);
    const tokenData = await exchangeCodeForToken(platform, code);
    
    if (!tokenData || !tokenData.access_token) {
      console.error(`Failed to get access token for ${platform}`);
      return NextResponse.redirect(
        new URL(`/connections?error=token_exchange_failed_for_${platform}`, request.url)
      );
    }
    
    // Get user profile from the platform
    console.log(`Getting user profile from ${platform}`);
    const profileData = await getUserProfile(platform, tokenData.access_token);
    
    if (!profileData || !profileData.id) {
      console.error(`Failed to get profile data for ${platform}`);
      return NextResponse.redirect(
        new URL(`/connections?error=profile_fetch_failed_for_${platform}`, request.url)
      );
    }
    
    // Save connection to Firestore
    console.log(`Saving ${platform} connection for user ${userId}`);
    await saveSocialMediaConnection(userId, platform, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      profileId: profileData.id,
      profileName: profileData.name || profileData.username || profileData.display_name,
    });
    
    // Redirect to connections page with success message
    const response = NextResponse.redirect(
      new URL(`/connections?success=${platform}_connected`, request.url)
    );
    
    // Clear the cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('platform');
    response.cookies.delete('user_id');
    
    return response;
  } catch (error) {
    console.error(`Error processing ${platform} OAuth callback:`, error);
    
    // Try to extract a more specific error message if possible
    let errorMsg = 'failed';
    if (error instanceof Error) {
      errorMsg = encodeURIComponent(error.message.substring(0, 50));
    }
    
    return NextResponse.redirect(
      new URL(`/connections?error=oauth_${platform}_${errorMsg}`, request.url)
    );
  }
}

// Helper to exchange authorization code for access token
async function exchangeCodeForToken(platform: PlatformID, code: string): Promise<any> {
  const provider = OAUTH_PROVIDERS[platform];
  const envVars = ENV_VAR_MAP[platform];
  
  const params = new URLSearchParams({
    client_id: process.env[envVars.clientId] || '',
    client_secret: process.env[envVars.clientSecret] || '',
    code,
    redirect_uri: provider.redirectUri,
    grant_type: 'authorization_code',
  });
  
  // Twitter requires Basic Auth instead of client_secret in the form body
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  
  if (platform === 'twitter') {
    const auth = Buffer.from(
      `${process.env[envVars.clientId]}:${process.env[envVars.clientSecret]}`
    ).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }
  
  console.log(`Making token request to ${provider.tokenUrl}`);
  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }
    throw new Error(`Failed to exchange code: ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

// Helper to get user profile from platform
async function getUserProfile(platform: PlatformID, accessToken: string): Promise<any> {
  const provider = OAUTH_PROVIDERS[platform];
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  };
  
  // TikTok API requires different authentication
  if (platform === 'tiktok') {
    delete headers.Authorization;
    const url = new URL(provider.profileUrl);
    url.searchParams.append('access_token', accessToken);
    
    console.log(`Making profile request to ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get profile: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return { 
      id: data.data.open_id || data.data.user_id, 
      name: data.data.display_name || data.data.nickname
    };
  }
  
  console.log(`Making profile request to ${provider.profileUrl}`);
  const response = await fetch(provider.profileUrl, { headers });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get profile: ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  
  // Different platforms return data in different formats
  switch (platform) {
    case 'instagram':
      // For Instagram, we need to get the Instagram Business Account ID from the Facebook Page
      // This is just a simplified example
      return { id: data.data[0]?.id, name: data.data[0]?.name };
    case 'twitter':
      return { id: data.data.id, username: data.data.username, name: data.data.name };
    case 'youtube':
      return { id: data.items[0]?.id, name: data.items[0]?.snippet?.title };
    default:
      return data;
  }
} 