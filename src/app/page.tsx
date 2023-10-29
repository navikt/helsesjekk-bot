import { ReactElement } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

import { getUser, verifyUserLoggedIn } from '../auth/authentication'
import { getTeamsByAdGroups, Team } from '../db'
import TeamCard from '../components/TeamCard'
import Code from '../components/core/Code'

import { Heading, BodyShort } from 'aksel-server'

export const metadata: Metadata = {
    title: 'Helsesjekk | Dine team',
    description: 'Oversikt over team du er medlem av i helsesjekk-bot',
}

export default async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/')

    const user = getUser()
    const assosiatedTeam = await getTeamsByAdGroups(user.adGroups)

    return (
        <div>
            <Heading size="large" spacing>
                Dine team ({assosiatedTeam.length})
            </Heading>

            {assosiatedTeam.length > 0 ? (
                <TeamsView teams={assosiatedTeam} />
            ) : (
                <div>
                    <BodyShort spacing>Du er ikke medlem i et team</BodyShort>
                    <BodyShort spacing>
                        Se på <Link href="/kom-i-gang">Kom i gang</Link> for å se hvordan du kan assosiere et team med
                        din innlogging. Du finner detaljer om hvilke grupper du er medlem i på{' '}
                        <Link href="/kom-i-gang/grupper">Kom i gang - Grupper</Link>
                    </BodyShort>
                    <BodyShort>
                        Dersom du allerede vet hvilken gruppe-id du skal bruke, kan du koble til teamet ditt ved å bruke
                        <Code>/helsesjekk assign gruppe-id</Code> i kanalen hvor botten er aktivert.
                    </BodyShort>
                </div>
            )}
        </div>
    )
}

function TeamsView({ teams }: { teams: Team[] }): ReactElement {
    return (
        <div>
            <div className="flex gap-4 flex-wrap">
                {teams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                ))}
            </div>
        </div>
    )
}
