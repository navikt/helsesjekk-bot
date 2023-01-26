import { Team } from '@prisma/client'

import logger from '../logger'
import { App } from '../app'
import { questionsFromJsonb } from '../questions/jsonb-utils'
import { createAsked } from "../db";

import { createCountMetricsContext, createRootPostBlocks } from './message-builder'

export async function postToTeam(team: Team, client: App['client']): Promise<boolean> {
    const message = await client.chat.postMessage({
        channel: team.id,
        text: `Hvordan har ${team.name} det?`,
        blocks: [...createRootPostBlocks(team.name), createCountMetricsContext(0)],
    })

    if (!message.ok || message.ts == null) {
        logger.error(`Unable to post message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    await createAsked(message.ts, team.id, questionsFromJsonb(team.questions))
    return true
}

export async function revealTeam(team: Team, client: App['client']): Promise<boolean> {
    // Update message

    // update asked boolean

    // post in thread

    // oke 2ke

    // q: how do we create a date in the users time zone?

    return true
}
