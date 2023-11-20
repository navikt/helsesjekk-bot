import { headers } from 'next/headers'
import { logger } from '@navikt/next-logger'
import { validateAzureToken } from '@navikt/next-auth-wonderwall'
import { redirect } from 'next/navigation'

import { isLocal } from '../utils/env'
import { raise } from '../utils/ts-utils'

import { fakeToken } from './fake-token'
import { getMembersOf } from './ms-graph'

import{ signIn } from "next-auth/react";

/**
 * Validates the wonderwall token according to nais.io. Should only actually redirect if the token has expired.
 */
export async function validateWonderwallToken(redirectPath: string): Promise<void> {
    const requestHeaders = headers()

    if (isLocal) {
        logger.warn('Is running locally, skipping RSC auth')
        return
    }

    const bearerToken: string | null | undefined = requestHeaders.get('authorization')
    if (!bearerToken) {
        logger.info('Found no token, redirecting to login')
        signIn("azure-ad", {callbackUrl: `${process.env.CALLBACK_URL}`})
        redirect(`/api/auth/signin/azure-ad`)
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
        redirect(`/api/auth/signin/azure-ad`)
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
} {
    const token = getToken(headers())
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
