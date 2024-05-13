'use client'

import React, { ReactElement, useEffect } from 'react'
import { logger } from '@navikt/next-logger'
import { Heading, BodyLong } from '@navikt/ds-react'
import { Button } from '@navikt/ds-react'

type Props = {
    error: Error & {
        digest?: string
    }
    reset: () => void
}

export default function Error({ error, reset }: Props): ReactElement {
    useEffect(() => {
        logger.error(error)
    }, [error])

    return (
        <div className="max-w-prose">
            <Heading size="large" level="1" spacing>
                Noe uventet gikk galt!
            </Heading>
            <BodyLong spacing>
                Det har oppstått et intern feil i applikasjonen. Dersom feiler fortsetter si gjerne i fra på{' '}
                <a href="https://nav-it.slack.com/archives/C04LCPR5E12" target="_blank" rel="noopener noreferrer">
                    #helsesjekk-bot
                </a>{' '}
                så vi får fikset feilen raskest mulig.
            </BodyLong>

            <div>
                <Button variant="secondary-neutral" onClick={() => reset()}>
                    Prøv å laste på nytt
                </Button>
            </div>
        </div>
    )
}
