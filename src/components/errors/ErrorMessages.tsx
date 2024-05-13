import React, { ReactElement } from 'react'
import { BodyLong, BodyShort, Heading } from '@navikt/ds-react'

import Code from '../core/Code'

export function TeamNotAccesible(): ReactElement {
    return (
        <div>
            <Heading size="large" spacing>
                Du har ikke tilgang til dette teamet
            </Heading>
            <BodyShort spacing>Teamet kan også ikke finnes.</BodyShort>
            <BodyLong>
                Du kan koble teamet ditt sin kanal til et team ved å bruke <Code>/helsesjekk assign gruppe-id</Code> i
                kanalen hvor botten er aktivert.
            </BodyLong>
        </div>
    )
}

export function TeamNotFound(): ReactElement {
    return (
        <div>
            <Heading size="large" spacing>
                Teamet finnes ikke
            </Heading>
            <BodyShort spacing>Teamet kan også ikke finnes.</BodyShort>
            <BodyLong spacing>
                Du kan koble teamet ditt sin kanal til et team ved å bruke <Code>/helsesjekk assign gruppe-id</Code> i
                kanalen hvor botten er aktivert.
            </BodyLong>
            <BodyLong>Dersom du har koblet til et team, så kan det være at du har brukt feil gruppe-id.</BodyLong>
        </div>
    )
}
