import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. If visiting root '/' or '/review' with ?token=..., immediately redirect to /review/[token]
  if ((pathname === '/' || pathname === '/review') && searchParams.has('token')) {
    const token = searchParams.get('token');
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = `/review/${encodeURIComponent(token)}`;
      url.searchParams.delete('token');
      return NextResponse.redirect(url, 307);
    }
  }

  // 2. Handle duplicate subpath if Endpoint URL was set with /review and LIFF appended /review/[token]
  if (pathname.startsWith('/review/review/')) {
    const token = pathname.replace('/review/review/', '');
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = `/review/${token}`;
      return NextResponse.redirect(url, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/review', '/review/review/:path*'],
};
