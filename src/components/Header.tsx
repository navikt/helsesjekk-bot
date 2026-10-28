import React, { ReactElement, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heading, Detail } from '@navikt/ds-react'

import logo from '../images/logo.png'

import LoggedInUser, { LoggedInUserSkeleton } from './LoggedInUser'
import { AkselNextLink } from './AkselNextLink'

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
            <ul className="list-disc ax-sm:list-none list-inside ml-4 ax-sm:ml-20 mb-6 ax-sm:mb-8 flex gap-3 ax-sm:gap-6 flex-col ax-sm:flex-row">
                <li>
                    <AkselNextLink className="no-underline hover:underline" href="/">
                        Mine team
                    </AkselNextLink>
                </li>
                <li>
                    <AkselNextLink className="no-underline hover:underline" href="/hva-er-helsesjekk">
                        Hva er helsesjekk
                    </AkselNextLink>
                </li>
                <li>
                    <AkselNextLink className="no-underline hover:underline" href="/kom-i-gang">
                        Kom i gang
                    </AkselNextLink>
                </li>
                <li>
                    <AkselNextLink className="no-underline hover:underline" href="/global-helse">
                        Helse i Nav
                    </AkselNextLink>
                </li>
                <li>
                    <AkselNextLink className="no-underline hover:underline" href="/kom-i-gang/grupper">
                        Mine grupper
                    </AkselNextLink>
                </li>
            </ul>
        </div>
    )
}

export default Header
