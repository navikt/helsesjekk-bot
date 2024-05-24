import React, { ReactElement } from 'react'
import Image from 'next/image'
import { CopyButton, Heading, BodyLong, BodyShort } from '@navikt/ds-react'
import { LinkIcon } from '@navikt/aksel-icons'

import Code from '../core/Code'

import step1 from './step1.png'
import step2 from './step2.png'
import step3 from './step3.png'
import step4 from './step4.png'

function HowToGuide(): ReactElement {
    return (
        <section aria-labelledby="main-title" className="max-w-prose">
            <Heading size="medium" level="2" id="main-title">
                Legg til botten i ditt team i Slack
            </Heading>
            <BodyLong spacing>
                Det første du må gjøre er å legge til slack-integrasjonen i ditt team sin kanal.
            </BodyLong>
            <BodyLong spacing>
                <span className="font-bold">
                    Det er sterkt anbefalt å legge til integrasjonen i en kanal som er dedikert til teamet ditt.
                </span>{' '}
                Dette kan være en kanal som heter noe alà <Code>#team-ditt-navn</Code>. Gjerne en kanal som er lukket
                for andre.
            </BodyLong>

            <BodyShort spacing>
                <span className="font-bold mr-2">1.</span>
                {`Klikk på navnet når du er inne på kanalen, deretter gå til 'Integrations', deretter 'Add apps':`}`
            </BodyShort>
            <Image
                className="mb-4 rounded-xl"
                src={step1}
                alt={`Skjermbilde av slack, som viser at man trykker på knappen for å legge til en integrasjon med navn "Helsesjekk"`}
            />

            <BodyShort spacing>
                <span className="font-bold mr-2">2.</span>
                {`Deretter søker du etter 'Helsesjekk':`}
            </BodyShort>
            <Image
                className="mb-4 rounded-xl"
                src={step2}
                alt={`Skjermbilde som viser søk etter helsesjekk botten, deretter at man trykker på knappen "Add"`}
            />

            <BodyShort spacing>
                <span className="font-bold mr-2">3.</span>
                Så som integrasjonen er registrert, må du aktivere Helsesjekk for teamet ditt. Dette gjør du ved å kjøre
                kommandoen <Code>/helsesjekk</Code> i kanalen hvor du la til integrasjonen.
            </BodyShort>
            <Image
                className="mb-4 rounded-xl"
                src={step3}
                alt="Skjermbilde som viser at man kjører kommandoen /helsesjekk i team-kanalen"
            />

            <BodyShort spacing>
                <span className="font-bold mr-2">4.</span>
                Når du gjør dette, vil du få opp innstillingene for teamet ditt. Her kan du sette opp når teamet ditt
                skal få spørsmål, og når svarene skal vises. Du kan også legge til bonus-spørsmål samt deaktivere appen
                dersom du har behov for å hoppe over en uke.
            </BodyShort>
            <Image
                className="mb-4 rounded-xl"
                src={step4}
                alt="Skjermbilde som viser at man kjører kommandoen /helsesjekk i team-kanalen"
            />

            <BodyShort spacing>
                Nå er botten klar til bruk. Første spørring vil bli spurt på dagen du har valgt.
            </BodyShort>

            <Heading size="medium" level="2" id="koble-til" className="flex items-center gap-2">
                Koble botten til denne nettsiden, så du kan se grafene dine og endre på innstillingene.
                <div>
                    <CopyButton
                        copyText="https://helsesjekk-bot.nav.no/kom-i-gang#koble-til"
                        activeText="Lenken er kopiert"
                        size="small"
                        icon={<LinkIcon aria-hidden />}
                    />
                </div>
            </Heading>

            <BodyLong spacing>
                For at teammedlemmene dine skal ha tilgang til å logge inn på denne nettsiden. Må vi koble kanalen
                slack-botten er aktivert til, til brukeren du er logget inn med.
            </BodyLong>

            <BodyLong spacing>
                Dette må gjøres via en gruppe i Microsoft-innloggingen, såkalte AD-grupper. Din slack kanal har ikke en
                egen gruppe i seg selv, men teamet ditt har mest sannsynligvis en gruppe som alle er medlem i.
            </BodyLong>

            <BodyLong spacing>
                Dersom du allerede har en AD-gruppe ID, kan du koble denne til teamet ditt ved å kjøre kommandoen{' '}
                <Code>/helsesjekk assign gruppe-id</Code> i kanalen hvor botten er aktivert.
            </BodyLong>

            <BodyLong spacing>
                Om du ikke har en AD-gruppe ID, kan du fortsette å lese for å finne ut hvordan du finner din gruppe.
            </BodyLong>
        </section>
    )
}

export default HowToGuide
