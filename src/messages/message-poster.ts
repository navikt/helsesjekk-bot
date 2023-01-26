import logger from '../logger'
import { App } from '../app'
import { questionsFromJsonb } from '../questions/jsonb-utils'
import { markAskedRevealed, createAsked, getActiveAsk, Team } from '../db'
import { scoreQuestions } from '../metrics/metrics'

import {
    createCompletedBlocks,
    createCountMetricsContext,
    createRootPostBlocks,
    createScoreBlocks,
} from './message-builder'

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

export async function updateResponseCount(team: Team, client: App['client']): Promise<boolean> {
    const asked = await getActiveAsk(team.id)

    if (asked == null) {
        logger.error('Weird state: Found no active asked when updating response count')
        return false
    }

    const message = await client.chat.update({
        channel: team.id,
        ts: asked.messageTs,
        blocks: [...createRootPostBlocks(team.name), createCountMetricsContext(asked.answers.length)],
    })

    if (!message.ok) {
        logger.error(`Unable to update message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    return true
}

export async function revealTeam(team: Team, client: App['client']): Promise<boolean> {
    const asked = await getActiveAsk(team.id)

    if (asked == null) {
        logger.error('Weird state: Found no active asked when trying to reveal')
        return false
    }

    const message = await client.chat.update({
        channel: team.id,
        ts: asked.messageTs,
        text: `Ukentlig helsesjekk for team ${team.name} er nå avsluttet.`,
        blocks: createCompletedBlocks(asked.answers.length),
    })
    await markAskedRevealed(asked.id)
    await client.chat.postMessage({
        channel: team.id,
        thread_ts: message.ts,
        text: `Svar på ukentlig helsesjekk for ${team.name}`,
        blocks: createScoreBlocks(team, scoreQuestions(asked)),
        reply_broadcast: true,
    })

    return true
}
