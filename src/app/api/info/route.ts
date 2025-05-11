import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This route is just for diagnostic purposes
  return NextResponse.json({
    message: 'API is functioning properly',
    env: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
      // Show just presence of keys to avoid security issues
      platforms: {
        facebook: {
          appId: !!process.env.FACEBOOK_APP_ID,
          appSecret: !!process.env.FACEBOOK_APP_SECRET,
        },
        instagram: {
          appId: !!process.env.INSTAGRAM_APP_ID,
          appSecret: !!process.env.INSTAGRAM_APP_SECRET,
        },
        twitter: {
          apiKey: !!process.env.TWITTER_API_KEY,
          apiSecretKey: !!process.env.TWITTER_API_SECRET_KEY,
        },
        tiktok: {
          apiKey: !!process.env.TIKTOK_API_KEY,
          appSecret: !!process.env.TIKTOK_APP_SECRET,
        },
        youtube: {
          clientId: !!process.env.YOUTUBE_CLIENT_ID,
          clientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
        },
      },
      stripe: {
        secretKey: !!process.env.STRIPE_SECRET_KEY,
        publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
    },
    serverTime: new Date().toISOString(),
  });
} 