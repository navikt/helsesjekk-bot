import React, { ReactElement, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heading, Detail } from '@navikt/ds-react'

import logo from '../images/logo.png'

import LoggedInUser, { LoggedInUserSkeleton } from './LoggedInUser'

function Header(): ReactElement {
    return (
        <div>
            <header className="flex justify-between">
                <Link href="/" className="flex w-full p-4 text-grayalpha-900">
                    <Image className="w-auto" src={logo} alt="" aria-hidden width={64} />
                    <div className="pl-4">
                        <Heading size="large">Helsesjekk</Heading>
                        <Detail>En helsesjekk-bot for ditt autonome team</Detail>
                    </div>
                </Link>
                <div>
                    <Suspense fallback={<LoggedInUserSkeleton />}>
                        <LoggedInUser />
                    </Suspense>
                </div>
            </header>
            <ul className="list-disc sm:list-none list-inside ml-4 sm:ml-20 mb-6 sm:mb-8 flex gap-3 sm:gap-6 flex-col sm:flex-row">
                <li>
                    <Link href="/">Mine team</Link>
                </li>
                <li>
                    <Link href="/hva-er-helsesjekk">Hva er helsesjekk</Link>
                </li>
                <li>
                    <Link href="/kom-i-gang">Kom i gang</Link>
                </li>
                <li>
                    <Link href="/global-helse">Helse i NAV</Link>
                </li>
                <li>
                    <Link href="/kom-i-gang/grupper">Mine grupper</Link>
                </li>
            </ul>
        </div>
    )
}

export default Header
