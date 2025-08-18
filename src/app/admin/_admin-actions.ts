'use server'

import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'

import { setTeamStatus } from '../../db'

export async function adminToggleTeamStatus(teamId: string, newStatus: boolean): Promise<void> {
    'use server'

    logger.info(`Admin is toggling team status for team ${teamId}, new status: ${newStatus}`)

    try {
        await setTeamStatus(teamId, newStatus)
    } catch (e) {
        logger.error(new Error('Unable to toggle', { cause: e }))
    }

    revalidatePath(`/admin`)
}
