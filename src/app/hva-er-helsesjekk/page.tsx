import React, { ReactElement } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'

import { Heading, BodyLong } from 'aksel-server'

import ask from './ask.png'
import reveal from './reveal.png'
import locked from './locked.png'

export const metadata: Metadata = {
    title: 'Helsesjekk | Hva er helsesjekk',
    description: 'En introduksjon til helsesjekk',
}

function Page(): ReactElement {
    return (
        <div className="max-w-prose">
            <Heading size="large" level="1">
                Hva er helsesjekk?
            </Heading>
            <Heading size="medium" level="2">
                Konsept
            </Heading>
            <BodyLong spacing>
                Helsesjekk er en måling av teamets helse. Helsesjekk måler helsen til teamet ditt basert på et sett med
                spørsmål. Konseptet er basert på{' '}
                <a
                    href="https://engineering.atspotify.com/2014/09/squad-health-check-model/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Spotify sin Squad Health Check konsept
                </a>
                . Spørsmålene svares på trafikk-lys format, med grønt for bra, gult for middels og rødt for dårlig.
                Disse målingene er ofte brukt i team som jobber med OKR.
            </BodyLong>
            <BodyLong spacing>Målingene er anonyme, og det er kun teamet selv som kan se sine egne målinger.</BodyLong>

            <Heading size="medium" level="2">
                Bruk botten
            </Heading>
            <BodyLong spacing>
                Spørsmålene stilles og besvares via en slack bot. Hver uke vil teamet få en interaktiv melding fra
                botten på slack. Du velger selv hvilken dag og når på dagen spørringen skal bli spurt.
            </BodyLong>

            <Image className="mb-6 rounded-xl" src={ask} alt="Skjermbilde som viser helsesjekk-spørringen i Slack" />

            <BodyLong spacing>
                Du velger også når spørringen skal lukkes. Når spørringen lukkes kan man ikke svare lengre, og det vil
                bli delt en teamhelse-oppsummering på Slack.
            </BodyLong>

            <Image
                className="mb-4 rounded-xl"
                src={locked}
                alt="Skjermbilde fra slack som viser at helsesjekken er låst"
            />

            <Image
                className="mb-4 rounded-xl"
                src={reveal}
                alt="Skjermbilde fra slack som viser resultatet fra helsesjekken"
            />

            <BodyLong spacing>
                Når teamet ditt er i gang med Helsesjekk, kan du konfigurere instillinger, fjere og legge til spørsmål,
                og se en graf over teamets helse over tid her i Helsesjekk Dashboard. Gå til{' '}
                <Link href="/kom-i-gang">Kom i gang</Link> for å se hvordan du setter opp tilgang til teamet.
            </BodyLong>
        </div>
    )
}

export default Page
