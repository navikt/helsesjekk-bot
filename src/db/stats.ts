import { and, count, desc, eq, isNotNull, sql } from 'drizzle-orm'

import { drizzle } from './drizzle/db'
import { answer, asked, team } from './drizzle/schema'

export async function funStats(): Promise<{
    activeTeams: number
    totalAsks: number
    totalAnswers: number
    biggestTeam: number
    dashboardTeams: number
    mostQuestions: number
}> {
    const db = drizzle()
    const completedAsk = and(eq(asked.revealed, true), eq(asked.skipped, false))

    const [activeTeams, totalAsks, totalAnswers, biggestTeam, dashboardTeams, mostQuestions] = await Promise.all([
        db.$count(team, eq(team.active, true)),
        db.$count(asked, completedAsk),
        db
            .select({ count: count() })
            .from(answer)
            .innerJoin(asked, eq(answer.askedId, asked.id))
            .where(completedAsk)
            .then(([it]) => it?.count ?? 0),
        db
            .select({ answers: count(answer.userId) })
            .from(asked)
            .leftJoin(answer, eq(answer.askedId, asked.id))
            .groupBy(asked.id)
            .orderBy(desc(count(answer.userId)))
            .limit(1)
            .then(([it]) => it?.answers ?? -1),
        db.$count(team, and(eq(team.active, true), isNotNull(team.assosiatedGroup))),
        db
            .select({ max: sql<number | null>`MAX(jsonb_array_length(${team.questions}))`.mapWith(Number) })
            .from(team)
            .then(([it]) => it?.max ?? -1),
    ])

    return {
        activeTeams,
        totalAsks,
        totalAnswers,
        biggestTeam,
        dashboardTeams,
        mostQuestions,
    }
}
