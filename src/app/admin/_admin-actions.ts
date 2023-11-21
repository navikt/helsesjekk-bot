'use server'

import { revalidatePath } from 'next/cache'

import { setTeamStatus } from '../../db'

export async function adminToggleTeamStatus(teamId: string, newStatus: boolean): Promise<void> {
    'use server'

    console.info(`Admin is toggling team status for team ${teamId}, new status: ${newStatus}`)

    try {
        await setTeamStatus(teamId, newStatus)
    } catch (e) {
        console.error('Unable to toggle', { cause: e })
    }

    revalidatePath(`/admin`)
}
