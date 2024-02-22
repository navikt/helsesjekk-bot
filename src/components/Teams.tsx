import React, { ReactElement, Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@navikt/ds-react'
import { BodyShort, Heading, Skeleton } from '@navikt/ds-react'

import { getTeamsByAdGroups } from '../db'
import { getUsersGroups, isUserLoggedIn } from '../auth/authentication'

import Code from './core/Code'
import TeamCard from './TeamCard'

async function Teams(): Promise<ReactElement> {
    if (!isUserLoggedIn()) {
        return (
            <div className="max-w-prose">
                <Heading size="large" spacing>
                    Dine team
                </Heading>
                <Heading size="medium" spacing>
                    Du er ikke logget inn
                </Heading>
                <BodyShort spacing>Du må være logget inn for å se dine team.</BodyShort>
                <Button as="a" href="/oauth2/login?redirect=/" variant="secondary-neutral" size="small">
                    Logg inn
                </Button>
            </div>
        )
    }

    return (
        <Suspense
            fallback={
                <div>
                    <Heading size="large" spacing>
                        Dine team
                    </Heading>
                    <div className="flex gap-4 flex-wrap">
                        <Skeleton variant="rounded" height={106} className="max-w-sm grow relative" />
                    </div>
                </div>
            }
        >
            <TeamsView />
        </Suspense>
    )
}

async function TeamsView(): Promise<ReactElement> {
    const userGroups = await getUsersGroups()
    const assosiatedTeam = (await getTeamsByAdGroups(userGroups)) ?? []

    if (assosiatedTeam.length === 0)
        return (
            <div className="max-w-prose">
                <Heading size="large" spacing>
                    Dine team
                </Heading>
                <BodyShort spacing>Du er ikke medlem i et team</BodyShort>
                <BodyShort spacing>
                    Se på <Link href="/kom-i-gang">Kom i gang</Link> for å se hvordan du kan assosiere et team med din
                    innlogging. Du finner detaljer om hvilke grupper du er medlem i på{' '}
                    <Link href="/kom-i-gang/grupper">Kom i gang - Grupper</Link>
                </BodyShort>
                <BodyShort>
                    Dersom du allerede vet hvilken gruppe-id du skal bruke, kan du koble til teamet ditt ved å bruke
                    <Code>/helsesjekk assign gruppe-id</Code> i kanalen hvor botten er aktivert.
                </BodyShort>
            </div>
        )

    return (
        <div>
            <Heading size="large" spacing>
                Dine team ({assosiatedTeam.length})
            </Heading>
            <div className="flex gap-4 flex-wrap">
                {assosiatedTeam.map((team) => (
                    <TeamCard key={team.id} team={team} />
                ))}
            </div>
        </div>
    )
}

export default Teams
