import React, { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import logo from '../images/logo.png'

import { Heading, Detail } from './aksel-server'

function Header(): ReactElement {
    return (
        <header>
            <Link href="/" className="flex w-full p-4 text-grayalpha-900">
                <Image className="object-contain" src={logo} alt="" aria-hidden height={48} />
                <div className="pl-4">
                    <Heading size="large">Helsesjekk</Heading>
                    <Detail>En helsesjekk-bot for ditt autotome team</Detail>
                </div>
            </Link>
        </header>
    )
}

export default Header
