import { prisma } from './prisma'

export async function funStats(): Promise<{
    activeTeams: number
    totalAsks: number
    totalAnswers: number
    biggestTeam: number
    dashboardTeams: number
    mostQuestions: number
}> {
    const [activeTeams, totalAsks, totalAnswers, biggestTeam, dashboardTeams, mostQuestions] = await Promise.all([
        await prisma().team.count({
            where: { active: true },
        }),
        await prisma().asked.count({
            where: { revealed: true, skipped: false },
        }),
        await prisma().answer.count({
            where: { asked: { revealed: true, skipped: false } },
        }),
        (
            await prisma().asked.findFirst({
                orderBy: {
                    answers: { _count: 'desc' },
                },
                include: {
                    _count: { select: { answers: true } },
                },
            })
        )?._count.answers ?? -1,
        await prisma().team.count({
            where: { active: true, assosiatedGroup: { not: null } },
        }),
        ((await prisma().$queryRaw`SELECT MAX(jsonb_array_length(questions)) FROM "Team";`) as { max: number }[])[0]
            ?.max ?? -1,
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
