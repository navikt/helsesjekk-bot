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
        blocks: [...createRootPostBlocks(team.name, new Date()), createCountMetricsContext(0)],
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
        text: `Hvordan har ${team.name} det?`,
        blocks: [...createRootPostBlocks(team.name, asked.timestamp), createCountMetricsContext(asked.answers.length)],
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

    if (asked.answers.length <= 3) {
        await client.chat.postMessage({
            channel: team.id,
            thread_ts: asked.messageTs,
            text: `Det er kun ${asked.answers.length} svar på helsesjekken. På grunn av personvern vil vi kun resultater med 4 eller flere svar vises.`,
            reply_broadcast: true,
        })
        await client.chat.update({
            channel: team.id,
            ts: asked.messageTs,
            text: `Ukentlig helsesjekk for team ${team.name} er nå avsluttet.`,
            blocks: [
                ...createRootPostBlocks(team.name, asked.timestamp, true),
                createCountMetricsContext(asked.answers.length),
            ],
        })
        await markAskedRevealed(asked.id)
        return false
    }

    const message = await client.chat.update({
        channel: team.id,
        ts: asked.messageTs,
        text: `Ukentlig helsesjekk for team ${team.name} er nå avsluttet.`,
        blocks: createCompletedBlocks(asked.answers.length, asked.timestamp),
    })
    await markAskedRevealed(asked.id)
    await client.chat.postMessage({
        channel: team.id,
        thread_ts: message.ts,
        text: `Svar på ukentlig helsesjekk for ${team.name}`,
        blocks: createScoreBlocks(team, asked, scoreQuestions(asked)),
        reply_broadcast: true,
    })

    return true
}
