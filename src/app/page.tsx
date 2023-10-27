import { ReactElement } from 'react'

import { getUser, verifyUserLoggedIn } from '../auth/authentication'
import { getTeamByAdGroup } from '../db'
import TeamCard from '../components/TeamCard'

import { Heading, BodyShort } from 'aksel-server'
import { List, ListItem } from 'aksel-client'

export default async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/')

    const user = getUser()
    const assosiatedTeam = await getTeamByAdGroup(user.adGroups)

    return (
        <div>
            <Heading size="large" spacing>
                Dine team ({assosiatedTeam.length})
            </Heading>
            {assosiatedTeam.length > 0 ? (
                assosiatedTeam.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
                <div>
                    <BodyShort>Du er ikke medlem i et team</BodyShort>

                    <List title="Dette er ad-gruppene du er medlem i" className="mt-4">
                        {user.adGroups.map((adGroup) => (
                            <ListItem key={adGroup}>{adGroup}</ListItem>
                        ))}
                    </List>

                    <BodyShort>
                        Du kan koble teamet ditt sin kanal til et team ved å bruke{' '}
                        <code className="bg-gray-100 p-1">/helsesjekk assign gruppe-id</code> i kanalen hvor botten er
                        aktivert.
                    </BodyShort>
                </div>
            )}
        </div>
    )
}
