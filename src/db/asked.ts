import logger from '../logger'
import { questionsToJsonb } from '../questions/jsonb-utils'

import { prisma, Asked } from './prisma'
import { Question } from './types'

export async function hasActiveAsk(teamId: string): Promise<boolean> {
    const asked = getActiveAsk(teamId)

    logger.info(`Checking if team ${teamId} has active ask: ${asked != null}`)

    return asked != null
}

export async function getActiveAsk(teamId: string): Promise<Asked | null> {
    return prisma.asked.findFirst({ where: { teamId, revealed: false } })
}

export async function getAsked(channelId: string, ts: string): Promise<Asked | null> {
    return prisma.asked.findFirst({
        where: { messageTs: ts, teamId: channelId },
    })
}

export async function createAsked(ts: string, teamId: string, questions: Question[]): Promise<void> {
    await prisma.asked.create({
        data: {
            teamId: teamId,
            messageTs: ts,
            timestamp: new Date(),
            questions: questionsToJsonb(questions),
            revealed: false,
        },
    })

    return
}
