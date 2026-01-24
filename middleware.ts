import { NextRequest, NextResponse } from 'next/server';

const CLOCK_DOMAIN = 'clock.puff.social';
const TARGET_HOSTNAME = 'puff-clock.dstn.to';
const OVERLAY_PATH = '/overlay';

export function middleware(req: NextRequest) {
  const hostHeader = req.headers.get('host');
  const host = hostHeader?.split(':')[0].toLowerCase();

  if (host !== CLOCK_DOMAIN) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  if (pathname === OVERLAY_PATH || pathname.startsWith(`${OVERLAY_PATH}/`)) {
    return NextResponse.next();
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.hostname = TARGET_HOSTNAME;
  redirectUrl.protocol = 'https';
  redirectUrl.port = '';

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: '/:path*',
};
