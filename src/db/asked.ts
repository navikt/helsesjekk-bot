import { startOfDay } from 'date-fns'
import { and, eq, gte, SQL } from 'drizzle-orm'

import { Answer, Asked } from '../db/types'
import { questionsToJsonb } from '../questions/jsonb-utils'
import { Question } from '../safe-types'

import { drizzle } from './drizzle/db'
import { answer, asked } from './drizzle/schema'
import { firstOrThrow } from './utils'

export async function hasActiveAsk(teamId: string): Promise<boolean> {
    return hasAny(and(eq(asked.teamId, teamId), eq(asked.revealed, false), eq(asked.skipped, false)))
}

export async function hasAskedToday(teamId: string): Promise<boolean> {
    return hasAny(and(eq(asked.teamId, teamId), gte(asked.timestamp, startOfDay(new Date()))))
}

export async function hasActiveUnnaggedAsk(teamId: string): Promise<boolean> {
    return hasAny(and(eq(asked.teamId, teamId), eq(asked.revealed, false), eq(asked.nagged, false)))
}

export async function getActiveAsk(teamId: string): Promise<(Asked & { answers: Answer[] }) | null> {
    const result = await drizzle().query.asked.findFirst({
        where: { teamId, revealed: false, skipped: false },
        with: { answers: true },
    })

    return result ?? null
}

export async function getPreviousAsk(ask: Asked): Promise<(Asked & { answers: Answer[] }) | null> {
    const result = await drizzle().query.asked.findFirst({
        where: { teamId: ask.teamId, revealed: true, id: { ne: ask.id }, skipped: false },
        orderBy: { timestamp: 'desc' },
        with: { answers: true },
    })

    return result ?? null
}

/**
 * Only used by dev-tools
 */
export async function getLatestAsk(teamId: string): Promise<(Asked & { answers: Answer[] }) | null> {
    const result = await drizzle().query.asked.findFirst({
        where: { teamId },
        orderBy: { timestamp: 'desc' },
        with: { answers: true },
    })

    return result ?? null
}

/**
 * Only used by dev-tools
 */
export async function markAskedUnrevealed(id: number): Promise<void> {
    firstOrThrow(
        await drizzle().update(asked).set({ revealed: false }).where(eq(asked.id, id)).returning({ id: asked.id }),
        'asked.update',
    )
}

export async function markAskedRevealed(id: number, skipped = false): Promise<void> {
    firstOrThrow(
        await drizzle()
            .update(asked)
            .set({ revealed: true, skipped })
            .where(eq(asked.id, id))
            .returning({ id: asked.id }),
        'asked.update',
    )
}

export async function markAskedAsNagged(id: number): Promise<void> {
    firstOrThrow(
        await drizzle().update(asked).set({ nagged: true }).where(eq(asked.id, id)).returning({ id: asked.id }),
        'asked.update',
    )
}

export async function getAsked(channelId: string, ts: string): Promise<Asked | null> {
    const [result] = await drizzle()
        .select()
        .from(asked)
        .where(and(eq(asked.messageTs, ts), eq(asked.teamId, channelId)))
        .limit(1)

    return result ?? null
}

export async function createAsked(ts: string, teamId: string, questions: Question[]): Promise<Asked> {
    const rows = await drizzle()
        .insert(asked)
        .values({
            teamId: teamId,
            messageTs: ts,
            timestamp: new Date(),
            questions: questionsToJsonb(questions),
            revealed: false,
            nagged: false,
        })
        .returning()

    return firstOrThrow(rows, 'asked.create')
}

export async function deleteAsked(askId: number): Promise<void> {
    await drizzle().transaction(async (tx) => {
        await tx.delete(answer).where(eq(answer.askedId, askId))
        firstOrThrow(await tx.delete(asked).where(eq(asked.id, askId)).returning({ id: asked.id }), 'asked.delete')
    })
}

async function hasAny(where: SQL | undefined): Promise<boolean> {
    const rows = await drizzle().select({ id: asked.id }).from(asked).where(where).limit(1)

    return rows.length > 0
}
