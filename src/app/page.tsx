import { ReactElement } from 'react'
import { headers } from 'next/headers'

import { getUser, verifyUserLoggedIn } from '../auth/authentication'
import { getTeamByAdGroup } from '../db'

import { Heading, BodyShort } from 'aksel-server'
import { List, ListItem } from 'aksel-client'

export default async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/')
    const authHeader = headers().get('authorization')

    const user = getUser()
    const assosiatedTeam = await getTeamByAdGroup(user.adGroups)

    return (
        <div className="container mx-auto">
            <Heading size="large">Your teams</Heading>
            {assosiatedTeam.length > 0 ? (
                <pre>{JSON.stringify(assosiatedTeam, null, 2)}</pre>
            ) : (
                <div>
                    <BodyShort>Not a member of any team</BodyShort>

                    <List title="These are your ad-groups" className="mt-4">
                        {user.adGroups.map((adGroup) => (
                            <ListItem key={adGroup}>{adGroup}</ListItem>
                        ))}
                    </List>

                    <BodyShort>
                        Connect any of these using <code className="bg-gray-100 p-1">/helsesjekk assign group-id</code>{' '}
                        in the channel where the bot is active.
                    </BodyShort>
                </div>
            )}
            <pre className="mt-16">Authorization header: {authHeader ?? 'Missing'}</pre>
        </div>
    )
}
