import { ReactElement } from 'react'
import { headers } from 'next/headers'

import { getUser, verifyUserLoggedIn } from '../auth/authentication'
import { getTeamByAdGroup } from '../db'

import { Heading } from 'aksel-server'

export default async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/')
    const authHeader = headers().get('authorization')

    const assosiatedTeam = await getTeamByAdGroup(getUser().adGroups)

    return (
        <div className="container mx-auto">
            <Heading size="large">Your team</Heading>
            {assosiatedTeam ? (
                <pre>{JSON.stringify(assosiatedTeam, null, 2)}</pre>
            ) : (
                <p>You are not a member of any team</p>
            )}
            <pre className="mt-16">Authorization header: {authHeader ?? 'Missing'}</pre>
        </div>
    )
}
