import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { getPlatformConnection } from '@/services/socialMediaService';
import { PlatformID } from '@/types';

export async function POST(req: NextRequest) {
  // Check authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { platform, content } = await req.json();
    
    // Validate input
    if (!platform || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user has connected this platform
    const connection = await getPlatformConnection(currentUser.uid, platform as PlatformID);
    if (!connection) {
      return NextResponse.json({ 
        error: `${platform} is not connected for this user` 
      }, { status: 400 });
    }
    
    // Post to the platform
    const result = await postToPlatform(platform as PlatformID, connection, content);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error posting to social media:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

async function postToPlatform(
  platform: PlatformID, 
  connection: any, 
  content: { text?: string; mediaUrls?: string[]; hashtags?: string[] }
): Promise<any> {
  // This would contain the actual implementation for each platform's API
  // Below is a simplified example of what this might look like
  
  const hashtagString = content.hashtags?.join(' ') || '';
  const fullText = content.text + (hashtagString ? ' ' + hashtagString : '');
  
  switch (platform) {
    case 'twitter':
      // Example Twitter API v2 call
      const twitterResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullText,
          // If there are media URLs, they would need to be uploaded separately first
        }),
      });
      
      if (!twitterResponse.ok) {
        const error = await twitterResponse.json();
        throw new Error(`Twitter API error: ${JSON.stringify(error)}`);
      }
      
      return twitterResponse.json();
      
    case 'facebook':
      // Example Facebook Graph API call
      const fbResponse = await fetch(`https://graph.facebook.com/v16.0/${connection.profileId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullText,
          access_token: connection.accessToken,
          // For media, you would use different endpoints or parameters
        }),
      });
      
      if (!fbResponse.ok) {
        const error = await fbResponse.json();
        throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
      }
      
      return fbResponse.json();
      
    case 'instagram':
      // Example Instagram Graph API call (simplified)
      // Real implementation would need to handle media upload first
      const igResponse = await fetch(`https://graph.facebook.com/v16.0/${connection.profileId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: fullText,
          access_token: connection.accessToken,
          // Media parameters would go here
        }),
      });
      
      if (!igResponse.ok) {
        const error = await igResponse.json();
        throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
      }
      
      return igResponse.json();
      
    // Additional cases for other platforms
    
    default:
      throw new Error(`Posting to ${platform} is not implemented yet`);
  }
} 