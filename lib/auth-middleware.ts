import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');
  const isEstimatorPage = request.nextUrl.pathname.startsWith('/estimator');
  const isInspectionPage = request.nextUrl.pathname.startsWith('/inspection');

  // Skip authentication for estimator and inspection token-based pages
  if (isEstimatorPage || isInspectionPage) {
    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    // Redirect to home if accessing auth pages while logged in
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Add paths that should be protected
    '/',
    '/admin/:path*',
    '/customer/:path*',
    '/inspector/:path*',
    '/estimator/:path*',
    '/vehicles',
    '/reports',
    '/settings',
    // Auth pages for redirection when logged in
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password/:path*',
  ],
}; 