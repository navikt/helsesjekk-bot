import { headers } from 'next/headers'
import { grantAzureOboToken, isInvalidTokenSet } from '@navikt/next-auth-wonderwall'
import { logger } from '@navikt/next-logger'

import { isLocal } from '../utils/env'

import { fakeMembersOfResponse } from './fake-members-of-response'
import { getToken } from './authentication'

export async function getMembersOf(): Promise<
    MsGraphGroupsResponse | { error: string; status?: number; statusText?: string }
> {
    if (isLocal) {
        return fakeMembersOfResponse
    }

    const token = getToken(headers())
    const tokenSet = await grantAzureOboToken(token, 'https://graph.microsoft.com/.default')
    if (isInvalidTokenSet(tokenSet)) {
        logger.error(new Error(`${tokenSet.errorType}: ${tokenSet.message}`, { cause: tokenSet.error }))
        return { error: 'Du har ikke tilgang til å se dine grupper.' }
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
            Authorization: `Bearer ${tokenSet}`,
        },
    })

    if (!response.ok) {
        return {
            error: 'Feil fra Microsoft, prøv igjen senere.',
            status: response.status,
            statusText: response.statusText,
        }
    }

    return response.json()
}

export type MsGraphGroup = {
    id: string
    createdDateTime: string
    description?: string
    displayName: string | null
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
}

type MsGraphGroupsResponse = {
    '@odata.context': string
    '@odata.nextLink'?: string
    value: MsGraphGroup[]
}
