import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { browserEnv, isLocal } from './utils/env'

export function middleware(request: NextRequest): NextResponse | void {
    const url = new URL(request.url)
    const forwardedHostHeader = request.headers.get('x-forwarded-host')

    // Redirect to new ingress in production env
    if (browserEnv.NEXT_PUBLIC_ENVIRONMENT === 'production' && forwardedHostHeader?.includes('intern')) {
        console.info('Hit old ingress, redirecting to new ingress')
        return NextResponse.redirect(new URL(url.pathname, 'https://helsesjekk-bot.nav.no/'))
    }

    // Make sure everyone is authed now that it's on a public ingress
    if (!isLocal && !request.headers.has('Authorization')) {
        return NextResponse.redirect(new URL(`/oauth2/login?redirect=${url.pathname}`, request.url))
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
