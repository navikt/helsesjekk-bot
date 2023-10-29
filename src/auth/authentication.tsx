import { headers } from 'next/headers'
import { logger } from '@navikt/next-logger'
import { validateAzureToken } from '@navikt/next-auth-wonderwall'
import { redirect } from 'next/navigation'

import { isLocal } from '../utils/env'
import { raise } from '../utils/ts-utils'

import { fakeToken } from './fake-token'

export async function verifyUserLoggedIn(redirectPath: string): Promise<void> {
    logger.info('Getting headers')
    const requestHeaders = headers()

    if (isLocal) {
        logger.warn('Is running locally, skipping RSC auth')
        return
    }

    const bearerToken: string | null | undefined = requestHeaders.get('authorization')
    if (!bearerToken) {
        logger.info('Found no token, redirecting to login')
        redirect(`/oauth2/login?redirect=${redirectPath}`)
    }

    const validationResult = await validateAzureToken(bearerToken)
    if (validationResult !== 'valid') {
        if (validationResult.errorType !== 'EXPIRED') {
            logger.error(
                new Error(
                    `Invalid JWT token found (cause: ${validationResult.errorType} ${validationResult.message}, redirecting to login.`,
                    { cause: validationResult.error },
                ),
            )
        }
        redirect(`/oauth2/login?redirect=${redirectPath}`)
    }
}

export function getToken(headers: Headers): string {
    if (isLocal) return fakeToken

    return (
        headers.get('authorization')?.replace('Bearer ', '') ??
        raise(new Error('Tried to get token, but header is missing'))
    )
}

export function getUser(): {
    name: string
    email: string
    adGroups: string[]
} {
    const token = getToken(headers())
    const jwt = JSON.parse(atob(token.split('.')[1]))

    return {
        name: jwt.name,
        email: jwt.preferred_username,
        adGroups: jwt.groups,
    }
}

export function isUserLoggedIn(): boolean {
    try {
        getUser()
        return true
    } catch (e) {
        return false
    }
}

export function userHasAdGroup(groupId: string): boolean {
    return getUser().adGroups.includes(groupId)
}
