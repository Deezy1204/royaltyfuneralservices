import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/clients') ||
        request.nextUrl.pathname.startsWith('/proposals') ||
        request.nextUrl.pathname.startsWith('/alterations') ||
        request.nextUrl.pathname.startsWith('/claims') ||
        request.nextUrl.pathname.startsWith('/payments') ||
        request.nextUrl.pathname.startsWith('/reports') ||
        request.nextUrl.pathname.startsWith('/users') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/profile');

    if (!token && isDashboardPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/clients/:path*',
        '/proposals/:path*',
        '/alterations/:path*',
        '/claims/:path*',
        '/payments/:path*',
        '/reports/:path*',
        '/users/:path*',
        '/settings/:path*',
        '/profile/:path*'
    ],
};
