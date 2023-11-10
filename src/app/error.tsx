'use client'

import React, { ReactElement, useEffect } from 'react'
import { logger } from '@navikt/next-logger'

import { Heading, BodyLong } from 'aksel-server'
import { Button } from 'aksel-client'

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
                <a
                    href="https://politietnoinn-5db1638.slack.com/archives/C04LV81HUBU"
                    target="_blank"
                    rel="noopener noreferrer"
                >
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
