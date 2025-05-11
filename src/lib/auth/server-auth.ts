import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase/config';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Get the authenticated user from the Firebase session cookie
 * This works in server components and API routes
 */
export async function getAuthenticatedUser(req?: NextRequest): Promise<DecodedIdToken | null> {
  try {
    // If this is a server component, get the session cookie from the cookies() helper
    // If this is an API route with a NextRequest, get the session cookie from the request
    const sessionCookie = req 
      ? req.cookies.get('session')?.value 
      : cookies().get('session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the session cookie and get the user
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    
    return decodedToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

/**
 * Get the current user's ID from cookies
 * This is a simpler fallback if Firebase Admin verification isn't working
 */
export function getUserIdFromCookies(req?: NextRequest): string | null {
  try {
    // Try to get the user ID from auth cookies
    const userIdCookie = req 
      ? req.cookies.get('firebase_user_id')?.value 
      : cookies().get('firebase_user_id')?.value;

    return userIdCookie || null;
  } catch (error) {
    console.error('Error getting user ID from cookies:', error);
    return null;
  }
} 