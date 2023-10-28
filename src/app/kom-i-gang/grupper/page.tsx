import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'
import { headers } from 'next/headers'
import { grantAzureOboToken, isInvalidTokenSet } from '@navikt/next-auth-wonderwall'
import { logger } from '@navikt/next-logger'
import { Metadata } from 'next'

import { getToken } from '../../../auth/authentication'
import { isLocal } from '../../../utils/env'

import { Alert, Heading, Skeleton } from 'aksel-server'

export const metadata: Metadata = {
    title: 'Helsesjekk | Dine grupper',
    description: 'Dine grupper i azure ad',
}

function Page(): ReactElement {
    return (
        <div>
            <Heading size="large" spacing>
                Dine grupper
            </Heading>
            <Suspense
                fallback={
                    <div>
                        {R.range(0, 30).map((it) => (
                            <Skeleton key={it} width={100} />
                        ))}
                    </div>
                }
            >
                <UserAdGroups />
            </Suspense>
        </div>
    )
}

async function UserAdGroups(): Promise<ReactElement> {
    if (isLocal) {
        return <Alert variant="warning">Local development</Alert>
    }

    const token = getToken(headers())
    const tokenSet = await grantAzureOboToken(token, 'https://graph.microsoft.com/.default')
    if (isInvalidTokenSet(tokenSet)) {
        return <Alert variant="warning">{JSON.stringify(tokenSet, null, 2)}</Alert>
    }

    logger.info(`DEBUG: tokenSet ${tokenSet}`)
    const response = await fetch('https://graph.microsoft.com/v1.0/groups', {
        headers: {
            Authorization: `Bearer ${tokenSet}`,
        },
    })

    if (!response.ok) {
        return (
            <div>
                <pre>
                    {response.status} {response.statusText}
                </pre>
                <pre>{response.json().catch(() => 'unable to parse json body')}</pre>
                <Alert variant="warning">{JSON.stringify(response, null, 2)}</Alert>
            </div>
        )
    }

    const result: MsGraphGroupsResponse = await response.json()
    return (
        <div>
            <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
    )
}

type MsGraphGroupsResponse = {
    '@odata.context': string
    '@odata.nextLink': string
    value: {
        id: string
        createdDateTime: string
        description?: string
        displayName: string
        groupTypes: string[]
        mail?: string
        mailEnabled: boolean
        mailNickname: string
        onPremisesDomainName?: string
        onPremisesLastSyncDateTime?: string
        onPremisesNetBiosName?: string
        onPremisesSamAccountName?: string
        onPremisesSecurityIdentifier?: string
        onPremisesSyncEnabled?: boolean
        proxyAddresses: string[]
        renewedDateTime: string
        securityEnabled: boolean
        securityIdentifier: string
        visibility?: string
    }[]
}

export default Page
