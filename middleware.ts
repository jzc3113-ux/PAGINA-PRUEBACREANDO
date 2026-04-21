import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const { supabase, response, user } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && pathname.startsWith('/admin')) {
    const role = await getUserRole(supabase, user);
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)']
};
