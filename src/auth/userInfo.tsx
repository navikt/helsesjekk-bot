import { logger } from '@navikt/next-logger'
import { headers } from 'next/headers'

export interface UserInfo {
    name: string
    email: string
    groups: string[]
}

export const getUserInfo = (): UserInfo | { error: string; status?: number; statusText?: string } => {
    const requestHeaders = headers()
    const forwardedEmail = requestHeaders.get('x-forwarded-email') || ''
    const forwardedGroups = requestHeaders.get('x-forwarded-groups') || ''
    if (forwardedEmail === '' || forwardedGroups === '') {
        logger.error(new Error('Azure EntraID email or groups was not forwarded correctly'))
        return { error: 'Azure EntraID email or groups was not forwarded correctly' }
    }

    const email = forwardedEmail.split(',').map((email) => email.trim())[0]
    const name = email.split('@')[0].replaceAll('.', ' ')
    const groups = forwardedGroups.split(',').map((group) => group.trim())
    return {
        name,
        email,
        groups,
    }
}
