import { count, eq } from 'drizzle-orm'
import * as R from 'remeda'

import { drizzle } from './drizzle/db'
import { answer, asked, team } from './drizzle/schema'
import type { Team, Asked } from './types'

type AdminAsked = Pick<Asked, 'id' | 'messageTs' | 'nagged' | 'skipped' | 'revealed' | 'questions'> & {
    _count: { answers: number }
}

export async function adminGetTeamsWithAsked(): Promise<(Team & { Asked: AdminAsked[] })[]> {
    const db = drizzle()
    const [allTeams, allAsked] = await Promise.all([
        db.select().from(team),
        db
            .select({
                teamId: asked.teamId,
                id: asked.id,
                messageTs: asked.messageTs,
                nagged: asked.nagged,
                skipped: asked.skipped,
                revealed: asked.revealed,
                questions: asked.questions,
                answerCount: count(answer.userId),
            })
            .from(asked)
            .leftJoin(answer, eq(answer.askedId, asked.id))
            .groupBy(asked.id),
    ])

    const askedByTeam = R.groupBy(allAsked, R.prop('teamId'))

    return allTeams.map((it) => ({
        ...it,
        Asked: (askedByTeam[it.id] ?? []).map((ask) => ({
            id: ask.id,
            messageTs: ask.messageTs,
            nagged: ask.nagged,
            skipped: ask.skipped,
            revealed: ask.revealed,
            questions: ask.questions,
            _count: { answers: ask.answerCount },
        })),
    }))
}
