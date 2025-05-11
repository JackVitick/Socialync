import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { PlatformID } from '@/types';

// Collection name for storing user's social media connections
const CONNECTIONS_COLLECTION = 'socialMediaConnections';

interface SocialMediaConnection {
  userId: string;
  platform: PlatformID;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profileId?: string;
  profileName?: string;
  connected: boolean;
}

/**
 * Save social media connection after successful OAuth
 */
export async function saveSocialMediaConnection(
  userId: string,
  platform: PlatformID,
  connectionData: Omit<SocialMediaConnection, 'userId' | 'platform' | 'connected'>
): Promise<void> {
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, `${userId}_${platform}`);
  
  await setDoc(connectionRef, {
    userId,
    platform,
    connected: true,
    ...connectionData,
  });
}

/**
 * Disconnect a social media platform
 */
export async function disconnectSocialMedia(userId: string, platform: PlatformID): Promise<void> {
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, `${userId}_${platform}`);
  await deleteDoc(connectionRef);
}

/**
 * Get all connected social media accounts for a user
 */
export async function getUserConnections(userId: string): Promise<SocialMediaConnection[]> {
  const connectionsQuery = query(
    collection(db, CONNECTIONS_COLLECTION),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(connectionsQuery);
  return snapshot.docs.map(doc => doc.data() as SocialMediaConnection);
}

/**
 * Check if a specific platform is connected
 */
export async function isPlatformConnected(userId: string, platform: PlatformID): Promise<boolean> {
  if (!userId) return false;
  
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, `${userId}_${platform}`);
  const docSnap = await getDoc(connectionRef);
  
  return docSnap.exists() && docSnap.data()?.connected === true;
}

/**
 * Get a specific platform connection data
 */
export async function getPlatformConnection(
  userId: string, 
  platform: PlatformID
): Promise<SocialMediaConnection | null> {
  if (!userId) return null;
  
  const connectionRef = doc(db, CONNECTIONS_COLLECTION, `${userId}_${platform}`);
  const docSnap = await getDoc(connectionRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as SocialMediaConnection;
  }
  
  return null;
}

// The actual posting functions would typically be implemented server-side for security
// Here we're defining the interface that would call our backend endpoints

/**
 * Post content to a specific platform
 * In a real implementation, this would call your backend API
 */
export async function postToSocialMedia(
  userId: string,
  platform: PlatformID,
  content: {
    text?: string;
    mediaUrls?: string[];
    hashtags?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  // This would make an API call to your backend service
  // which would handle the actual posting using the stored tokens
  
  try {
    // Simulate API call
    console.log(`Posting to ${platform} for user ${userId}`);
    console.log('Content:', content);
    
    // In a real implementation, make a fetch call to your backend
    // const response = await fetch('/api/social/post', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, platform, content }),
    // });
    // const data = await response.json();
    // return data;
    
    // Mock success
    return { success: true };
  } catch (error) {
    console.error(`Error posting to ${platform}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Post content to multiple platforms at once
 */
export async function postToMultiplePlatforms(
  userId: string,
  platforms: PlatformID[],
  content: {
    text?: string;
    mediaUrls?: string[];
    hashtags?: string[];
  }
): Promise<Record<PlatformID, { success: boolean; error?: string }>> {
  const results: Record<PlatformID, { success: boolean; error?: string }> = {} as any;
  
  // Post to each platform
  for (const platform of platforms) {
    results[platform] = await postToSocialMedia(userId, platform, content);
  }
  
  return results;
} 