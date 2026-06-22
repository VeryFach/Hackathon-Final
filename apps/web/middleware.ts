import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TODO: Re-enable auth after hackathon demo
  // const token = request.cookies.get('cookie_token')?.value;
  // const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  // const isRegisterPage = request.nextUrl.pathname.startsWith('/register');
  // const isAuthPage = isLoginPage || isRegisterPage;
  //
  // if (!token && !isAuthPage) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  //
  // if (token && isAuthPage) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
