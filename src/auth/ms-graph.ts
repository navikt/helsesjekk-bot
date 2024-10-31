// import { headers } from 'next/headers'
// import { logger } from '@navikt/next-logger'

import { isLocal } from '../utils/env'

import { fakeMembersOfResponse } from './fake-members-of-response'
// import { getUserToken } from './authentication'

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function getMembersOf(): Promise<
    MsGraphGroupsResponse | { error: string; status?: number; statusText?: string }
> {
    if (isLocal) {
        return fakeMembersOfResponse
    }

    // TODO: integrate with entra ID
    return fakeMembersOfResponse
    /* const token = getUserToken(headers())
    const tokenSet = await requestOboToken(token, 'https://graph.microsoft.com/.default')
    if (!tokenSet.ok) {
        logger.error(new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error }))
        return { error: 'Du har ikke tilgang til å se dine grupper.' }
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf?$top=999', {
        headers: {
            Authorization: `Bearer ${tokenSet.token}`,
        },
    })

    if (!response.ok) {
        return {
            error: 'Feil fra Microsoft, prøv igjen senere.',
            status: response.status,
            statusText: response.statusText,
        }
    }

    return response.json() */
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