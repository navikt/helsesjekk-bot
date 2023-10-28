'use server'

import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'

import { setTeamName } from '../../db'
import { userHasAdGroup } from '../../auth/authentication'

export async function editTeamName(groupId: string, teamId: string, formData: FormData): Promise<void> {
    if (!userHasAdGroup(groupId)) {
        throw new Error('User does not have access to edit team name')
    }

    const name = formData.get('new_name').toString()

    logger.info(`User is editing team name, new name: ${name}`)

    await setTeamName(teamId, name)

    revalidatePath(`/team/${groupId}`)
}
