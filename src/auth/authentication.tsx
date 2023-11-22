import { headers } from 'next/headers'
import { validateAzureToken } from '@navikt/next-auth-wonderwall'
import { redirect } from 'next/navigation'

import { getToken as getJwtToken } from "next-auth/jwt"

import { isLocal } from '../utils/env'
import { raise } from '../utils/ts-utils'

import { fakeToken } from './fake-token'
import { getMembersOf } from './ms-graph'
import { getServerSession } from 'next-auth'

/**
 * Validates the wonderwall token according to nais.io. Should only actually redirect if the token has expired.
 */
export async function validateToken(redirectPath: string): Promise<void> {
    const requestHeaders = headers()
    
    if (isLocal) {
        console.warn('Is running locally, skipping RSC auth')
        return
    }
    const session = await getServerSession();

    const bearerToken: string | null | undefined = session.accessToken;
    if (!bearerToken) {
        console.info('Found no token, redirecting to login')
        redirect(`/api/auth/signin/azure-ad`)
    }

    const validationResult = await validateAzureToken(bearerToken)
    if (validationResult !== 'valid') {
        if (validationResult.errorType !== 'EXPIRED') {
            console.error(
                new Error(
                    `Invalid JWT token found (cause: ${validationResult.errorType} ${validationResult.message}, redirecting to login.`,
                    { cause: validationResult.error },
                ),
            )
        }
        redirect(`/api/auth/signin/azure-ad`)
    }
}

export async function getToken(headers: Headers): Promise<string> {
    if (isLocal) return fakeToken
    const session = await getServerSession();
    return session.accessToken;
}

export async function getUser(): Promise<{
    name: string
    email: string
}> {
    const token = await getToken(headers())
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

export async function userHasAdGroup(groupId: string): Promise<boolean> {
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
