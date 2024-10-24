import { headers } from 'next/headers'
import { validateToken, getToken } from '@navikt/oasis'
import { redirect } from 'next/navigation'

import { isLocal } from '../utils/env'
import { raise } from '../utils/ts-utils'

import { fakeToken } from './fake-token'
import { getMembersOf } from './ms-graph'

/**
 * Validates the wonderwall token according to nais.io. Should only actually redirect if the token has expired.
 */
export async function validateWonderwallToken(redirectPath: string): Promise<void> {
    const requestHeaders = headers()

    if (isLocal) {
        console.warn('Is running locally, skipping RSC auth')
        return
    }

    const token = getToken(requestHeaders)
    if (!token) {
        console.warn('Found no token, redirecting to login, why was this not picked up by middleware.ts?')
        redirect(`/oauth2/login?redirect=${redirectPath}`)
    }

    const validationResult = await validateToken(token)
    if (!validationResult.ok) {
        if (validationResult.errorType !== 'token expired') {
            console.error(
                new Error(
                    `Invalid JWT token found (cause: ${validationResult.errorType} ${validationResult.error.message}, redirecting to login.`,
                    { cause: validationResult.error },
                ),
            )
        }

        redirect(`/oauth2/login?redirect=${redirectPath}`)
    }
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
    const membersOf = await getMembersOf()

    if ('error' in membersOf) {
        throw new Error(
            `Failed to get groups for user, MS responded with ${membersOf.status} ${membersOf.statusText}`,
            {
                cause: membersOf.error,
            },
        )
    }

    if (membersOf['@odata.nextLink'] != null) {
        const user = getUser()
        console.error(
            `Whops! A user (${user.email}) has more than max page groups (${membersOf.value.length}), time to implement pagination?`,
        )
    }

    return membersOf.value.map((group) => group.id)
}

export function isUserLoggedIn(): boolean {
    try {
        getUser()
        return true
    } catch (e) {
        return false
    }
}

export async function userHasAdGroup(groupId: string | null): Promise<boolean> {
    if (!groupId) return false

    const membersOf = await getMembersOf()

    if ('error' in membersOf) {
        throw new Error(
            `Failed to get groups for user, MS responded with ${membersOf.status} ${membersOf.statusText}`,
            {
                cause: membersOf.error,
            },
        )
    }

    return membersOf.value.some((group) => group.id === groupId)
}
