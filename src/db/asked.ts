import { Answer } from '@prisma/client'

import { questionsToJsonb } from '../questions/jsonb-utils'

import { Asked, prisma } from './prisma'
import { Question } from './types'

export async function hasActiveAsk(teamId: string): Promise<boolean> {
    return (
        (await prisma.asked.findFirst({
            where: { teamId, revealed: false },
        })) != null
    )
}

export async function hasActiveUnnaggedAsk(teamId: string): Promise<boolean> {
    return (
        (await prisma.asked.findFirst({
            where: { teamId, revealed: false, nagged: false },
        })) != null
    )
}

export async function getActiveAsk(teamId: string): Promise<(Asked & { answers: Answer[] }) | null> {
    return prisma.asked.findFirst({
        where: { teamId, revealed: false },
        include: { answers: true },
    })
}

export async function getPreviousAsk(ask: Asked): Promise<(Asked & { answers: Answer[] }) | null> {
    return prisma.asked.findFirst({
        where: { teamId: ask.teamId, revealed: true, id: { not: ask.id }, skipped: false },
        orderBy: { timestamp: 'desc' },
        include: { answers: true },
    })
}

export async function markAskedRevealed(id: number): Promise<void> {
    await prisma.asked.update({
        where: { id },
        data: { revealed: true },
    })
}

export async function markAskedAsNagged(id: number): Promise<void> {
    await prisma.asked.update({
        where: { id },
        data: { nagged: true },
    })
}

export async function getAsked(channelId: string, ts: string): Promise<Asked | null> {
    return prisma.asked.findFirst({
        where: { messageTs: ts, teamId: channelId },
    })
}

export async function createAsked(ts: string, teamId: string, questions: Question[]): Promise<Asked> {
    return prisma.asked.create({
        data: {
            teamId: teamId,
            messageTs: ts,
            timestamp: new Date(),
            questions: questionsToJsonb(questions),
            revealed: false,
            nagged: false,
        },
    })
}
