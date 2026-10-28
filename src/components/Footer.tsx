import { Heading, BodyShort } from '@navikt/ds-react'
import Image from 'next/image'
import React, { ReactElement } from 'react'

import logo from '../images/logo.png'

export function Footer(): ReactElement {
    return (
        <footer className="border-t border-t-ax-border-neutral-subtle mt-4 p-4 flex">
            <Image
                className="object-contain grayscale hover:grayscale-0 transition-all hidden ax-sm:block"
                src={logo}
                alt=""
                aria-hidden
                height={128}
                quality={100}
            />
            <div className="pl-4 mt-4">
                <Heading size="medium" level="2">
                    Helsesjekk er utviklet og vedlikeholdt av Team Sykmelding.
                </Heading>
                <BodyShort>
                    Feedback og bugs kan rapporteres på slack på{' '}
                    <a href="https://nav-it.slack.com/archives/C04LCPR5E12" target="_blank" rel="noopener noreferrer">
                        #helsesjekk-bot
                    </a>
                </BodyShort>
                <BodyShort>
                    Kildekoden er tilgjengelig på{' '}
                    <a href="https://github.com/navikt/helsesjekk-bot" target="_blank" rel="noopener noreferrer">
                        github.com/navikt/helsesjekk-bot
                    </a>
                </BodyShort>
            </div>
        </footer>
    )
}
