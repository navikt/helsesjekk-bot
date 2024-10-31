import { headers } from 'next/headers'
import { logger } from '@navikt/next-logger'
// import { validateToken, getToken } from '@navikt/oasis'
// import { redirect } from 'next/navigation'

import { isLocal } from '../utils/env'
import { raise } from '../utils/ts-utils'

import { fakeToken } from './fake-token'
import { getUserInfo } from './userInfo'

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Validates the wonderwall token according to nais.io. Should only actually redirect if the token has expired.
 */
export async function validateWonderwallToken(redirectPath: string): Promise<void> {
    // const requestHeaders = headers()

    if (isLocal) {
        logger.warn('Is running locally, skipping RSC auth')
        return
    }

    // const token = getToken(requestHeaders)
    // if (!token) {
    //     logger.warn('Found no token, redirecting to login, why was this not picked up by middleware.ts?')
    //     redirect(`/oauth2/login?redirect=${redirectPath}`)
    // }

    // const validationResult = await validateToken(token)
    // if (!validationResult.ok) {
    //     if (validationResult.errorType !== 'token expired') {
    //         logger.error(
    //             new Error(
    //                 `Invalid JWT token found (cause: ${validationResult.errorType} ${validationResult.error.message}, redirecting to login.`,
    //                 { cause: validationResult.error },
    //             ),
    //         )
    //     }

    //     redirect(`/oauth2/login?redirect=${redirectPath}`)
    // }
}

export function getUserToken(headers: Headers): string {
    if (isLocal) return fakeToken

    return (
        headers.get('authorization')?.replace('Bearer ', '') ??
        raise(new Error('Tried to get token, but header is missing'))
    )
}

export function getUser(): {
    name: string
    email: string
} {
    const token = getUserToken(headers())
    const jwt = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))

    return {
        name: jwt.name,
        email: jwt.preferred_username,
    }
}

export async function getUsersGroups(): Promise<string[]> {
    const userInfo = getUserInfo()

    if ('error' in userInfo) {
        throw new Error(`Failed to get groups for user: ${userInfo.status} ${userInfo.statusText}`, {
            cause: userInfo.error,
        })
    }

    return userInfo.groups
}

export function isUserLoggedIn(): boolean {
    const userInfo = getUserInfo()
    if ('error' in userInfo) {
        return false
    }
    return true
}

export async function userHasAdGroup(groupId: string | null): Promise<boolean> {
    if (!groupId) return false

    const userInfo = await getUserInfo()

    if ('error' in userInfo) {
        throw new Error(`Failed to get groups for user: ${userInfo.status} ${userInfo.statusText}`, {
            cause: userInfo.error,
        })
    }

    return userInfo.groups.includes(groupId)
}
