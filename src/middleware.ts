
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add any routes here that should be publicly accessible even if the user is logged in
// (e.g., if you had a /pricing page or /about page that shouldn't redirect if logged in)
const PUBLIC_ROUTES_WHEN_LOGGED_IN = ['/login', '/signup']; 

// Add any routes here that require authentication
const PROTECTED_ROUTES = ['/calendar']; // Example, '/' AIOPost page is handled in-page for now.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthToken = request.cookies.has('firebaseIdToken'); // Example, adjust to your actual token cookie name

  // If trying to access login or signup page while already authenticated, redirect to home
  if (hasAuthToken && PUBLIC_ROUTES_WHEN_LOGGED_IN.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If trying to access a protected route without authentication, redirect to login
  // Include the original path as a query parameter for redirection after login
  if (!hasAuthToken && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname); // Add the original path for redirect after login
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files in public folder (e.g. /images, /fonts)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
