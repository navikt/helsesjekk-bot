import { Team } from '@prisma/client'

import logger from '../logger'
import { createAsked } from '../db/prisma'
import { App } from '../app'
import { fromJsonb } from '../questions/jsonb-utils'

import { createBlocks } from './message-builder'

export async function postToTeam(team: Team, client: App['client']): Promise<boolean> {
    const message = await client.chat.postMessage({
        channel: team.id,
        text: `Hvordan har ${team.name} det?`,
        blocks: createBlocks(team.name, fromJsonb(team.questions)),
    })

    if (!message.ok || message.ts == null) {
        logger.error(`Unable to post message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    await createAsked(message.ts, team.id, fromJsonb(team.questions))
    return true
}
