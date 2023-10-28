import React, { ReactElement } from 'react'
import { Metadata } from 'next'

import LinkButton from '../../components/core/LinkButton'

import { Heading, BodyLong } from 'aksel-server'

export const metadata: Metadata = {
    title: 'Helsesjekk | Kom i gang',
    description: 'Kom i gang med helsesjekk-bot',
}

function Page(): ReactElement {
    return (
        <div>
            <Heading size="large">Kom i gang med helsesjekk-bot for ditt team</Heading>
            <BodyLong>Kommer...</BodyLong>
            <GroupFinder />
        </div>
    )
}

function GroupFinder(): ReactElement {
    return (
        <div className="mt-8">
            <Heading size="medium" level="2">
                Finn din gruppe
            </Heading>
            <BodyLong spacing className="max-w-prose">
                For å gi teamet ditt tilgang til å kunne se info om sitt team, må du finne en felles ad-gruppe for
                teamet. Din bruker kan være knyttet til titalls grupper, men teamet ditt har mest sannsynligvis en
                gruppe som alle er medlem i. Denne gruppen heter typisk noe alà team-navnet ditt.
            </BodyLong>
            <BodyLong spacing className="max-w-prose">
                En måte å finne denne gruppen på er å sjekke på{' '}
                <a
                    href="https://myaccount.microsoft.com/groups/groups-i-belong-to"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Microsoft.com - Groups I belong to
                </a>
                .
            </BodyLong>
            <BodyLong spacing>Dersom du ikke finner gruppen din der, kan du se alle dine ad-grupper her:</BodyLong>
            <LinkButton href="/kom-i-gang/grupper">Finn mine grupper</LinkButton>
        </div>
    )
}

export default Page
