import { App } from '../app'
import { questionsFromJsonb } from '../../questions/jsonb-utils'
import { markAskedRevealed, createAsked, getActiveAsk, Team, getPreviousAsk, markAskedAsNagged } from '../../db'
import { scoreAsked } from '../../metrics/metrics'

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
        blocks: [
            ...createRootPostBlocks(team.name, new Date()),
            createCountMetricsContext(0, team.revealHour, team.revealDay),
        ],
    })

    if (!message.ok || message.ts == null) {
        console.error(`Unable to post message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    await createAsked(message.ts, team.id, questionsFromJsonb(team.questions))
    return true
}

export async function remindTeam(team: Team, client: App['client']): Promise<boolean> {
    const asked = await getActiveAsk(team.id)

    if (asked == null) {
        console.error('Weird state: Found no active asked when trying nag team')
        return false
    }

    const message = await client.chat.postMessage({
        channel: team.id,
        thread_ts: asked.messageTs,
        text: `:mega: Nå er det kun en time til helsesjekken stenges! :mega:\n\nDet er foreløpig ${asked.answers.length} som har svart.`,
        reply_broadcast: true,
    })

    if (!message.ok || message.ts == null) {
        console.error(`Unable to post message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    await markAskedAsNagged(asked.id)
    return true
}

export async function updateResponseCount(team: Team, client: App['client']): Promise<boolean> {
    const asked = await getActiveAsk(team.id)

    if (asked == null) {
        return false
    }

    const message = await client.chat.update({
        channel: team.id,
        ts: asked.messageTs,
        text: `Hvordan har ${team.name} det?`,
        blocks: [
            ...createRootPostBlocks(team.name, asked.timestamp),
            createCountMetricsContext(asked.answers.length, team.revealHour, team.revealDay),
        ],
    })

    if (!message.ok) {
        console.error(`Unable to update message for team ${team.name}, error: ${message.error ?? 'Unknown error'}`)
        return false
    }

    return true
}

export async function revealTeam(team: Team, client: App['client']): Promise<boolean> {
    const asked = await getActiveAsk(team.id)

    if (asked == null) {
        console.error('Weird state: Found no active asked when trying to reveal')
        return false
    }

    if (asked.answers.length < 3) {
        await client.chat.postMessage({
            channel: team.id,
            thread_ts: asked.messageTs,
            text: `Det er kun ${asked.answers.length} svar på helsesjekken. Det kreves minimum 3 svar for at resultatene skal deles.`,
            reply_broadcast: true,
        })
        await client.chat.update({
            channel: team.id,
            ts: asked.messageTs,
            text: `Ukentlig helsesjekk for team ${team.name} er nå avsluttet.`,
            blocks: [
                ...createRootPostBlocks(team.name, asked.timestamp, true),
                createCountMetricsContext(asked.answers.length, team.revealHour, team.revealDay),
            ],
        })
        await markAskedRevealed(asked.id, true)
        return false
    }

    const message = await client.chat.update({
        channel: team.id,
        ts: asked.messageTs,
        text: `Ukentlig helsesjekk for team ${team.name} er nå avsluttet.`,
        blocks: createCompletedBlocks(asked.answers.length, asked.timestamp),
    })
    const previousAsked = await getPreviousAsk(asked)
    const scoredAsk = scoreAsked(asked)
    const previousScoredAsk = previousAsked ? scoreAsked(previousAsked) : null

    await client.chat.postMessage({
        channel: team.id,
        thread_ts: message.ts,
        text: `Svar på ukentlig helsesjekk for ${team.name}`,
        blocks: createScoreBlocks(team, asked, scoredAsk, previousScoredAsk),
        reply_broadcast: true,
    })
    await markAskedRevealed(asked.id)

    return true
}
