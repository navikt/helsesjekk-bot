import React, { ReactElement } from 'react'
import Image from 'next/image'

import { Heading, BodyShort } from 'aksel-server'

import logo from '../images/logo.png'

function Footer(): ReactElement {
    return (
        <footer className="border-t border-t-border-subtle mt-4 p-4 flex">
            <Image
                className="object-contain grayscale hover:grayscale-0 transition-all hidden sm:block"
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
                    <a
                        href="https://politietnoinn-5db1638.slack.com/archives/C04LV81HUBU"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        #helsesjekk-bot
                    </a>
                </BodyShort>
                <BodyShort>
                    Kildekoden er tilgjengelig på{' '}
                    <a href="https://github.com/politiet/helsesjekk-bot" target="_blank" rel="noopener noreferrer">
                        github.com/politiet/helsesjekk-bot
                    </a>
                </BodyShort>
            </div>
        </footer>
    )
}

export default Footer
