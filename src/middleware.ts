import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { browserEnv, isLocal } from './utils/env'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest): NextResponse | void {
    const url = new URL(request.url)

    // Redirect to new ingress in production env
    if (browserEnv.NEXT_PUBLIC_ENVIRONMENT !== 'production' && url.host.includes('intern')) {
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
