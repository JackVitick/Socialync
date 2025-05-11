import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { PlatformID } from '@/types';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser, getUserIdFromCookies } from '@/lib/auth/server-auth';

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

// Define the OAuth endpoints for each platform
const OAUTH_PROVIDERS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v16.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v16.0/oauth/access_token',
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,instagram_basic,instagram_content_publish',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
  },
  instagram: {
    // Instagram uses Facebook's OAuth
    authUrl: 'https://www.facebook.com/v16.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v16.0/oauth/access_token',
    scope: 'instagram_basic,instagram_content_publish,pages_show_list',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scope: 'tweet.read tweet.write users.read offline.access',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    scope: 'user.info.basic,video.publish',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
  },
};

// Start OAuth process for a platform
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  console.log(`OAuth authentication for platform: ${params.platform}`);
  
  // Get the platform from route parameters
  const platform = params.platform as PlatformID;
  
  // Validate platform
  if (!Object.keys(OAUTH_PROVIDERS).includes(platform)) {
    console.error(`Invalid platform: ${platform}`);
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }
  
  // Verify environment variables are set
  const envVars = ENV_VAR_MAP[platform];
  if (!process.env[envVars.clientId] || !process.env[envVars.clientSecret]) {
    console.error(`Missing environment variables for ${platform}`);
    return NextResponse.redirect(
      new URL(`/connections?error=missing_config_for_${platform}`, request.url)
    );
  }
  
  // Get current user using server-side auth helper
  // Try both authentication methods
  const authenticatedUser = await getAuthenticatedUser(request);
  let userId = authenticatedUser?.uid;
  
  // If server auth failed, try fallback to cookie
  if (!userId) {
    userId = getUserIdFromCookies(request);
  }
  
  // If still no user ID, try client-side auth currentUser as a last resort
  if (!userId && auth.currentUser) {
    userId = auth.currentUser.uid;
  }
  
  if (!userId) {
    console.error('No authenticated user found');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Generate state param to prevent CSRF
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in cookies
  const response = NextResponse.redirect(getOAuthUrl(platform, state));
  response.cookies.set('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  response.cookies.set('platform', platform, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  response.cookies.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  
  console.log(`Redirecting to ${platform} OAuth URL`);
  return response;
}

// Helper to build OAuth URL with correct parameters
function getOAuthUrl(platform: PlatformID, state: string): string {
  const provider = OAUTH_PROVIDERS[platform];
  const envVars = ENV_VAR_MAP[platform];
  
  const params = new URLSearchParams({
    client_id: process.env[envVars.clientId] || '',
    redirect_uri: provider.redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state,
  });
  
  return `${provider.authUrl}?${params.toString()}`;
} 