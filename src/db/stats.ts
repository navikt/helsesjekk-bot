import { prisma } from './prisma'

export async function funStats(): Promise<{
    activeTeams: number
    totalAsks: number
    totalAnswers: number
    biggestTeam: number
    dashboardTeams: number
    mostQuestions: number
}> {
    const db = prisma()

    const [activeTeams, totalAsks, totalAnswers, biggestTeam, dashboardTeams, mostQuestions] = await Promise.all([
        db.team.count({ where: { active: true } }),
        db.asked.count({ where: { revealed: true, skipped: false } }),
        db.answer.count({ where: { asked: { revealed: true, skipped: false } } }),
        db.asked
            .findFirst({
                orderBy: { answers: { _count: 'desc' } },
                include: { _count: { select: { answers: true } } },
            })
            .then((it) => it?._count.answers ?? -1),
        db.team.count({ where: { active: true, assosiatedGroup: { not: null } } }),
        db.$queryRaw`SELECT MAX(jsonb_array_length(questions)) FROM "Team";`.then(
            (it) => (it as { max: number }[])[0]?.max ?? -1,
        ),
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
