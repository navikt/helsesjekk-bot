import { prisma } from './prisma'

export async function funStats(): Promise<{
    activeTeams: number
    totalAsks: number
    totalAnswers: number
    biggestTeam: number
}> {
    const [activeTeams, totalAsks, totalAnswers, biggestTeam] = await Promise.all([
        await prisma.team.count({
            where: { active: true },
        }),
        await prisma.asked.count({
            where: { revealed: true, skipped: false },
        }),
        await prisma.answer.count({
            where: { asked: { revealed: true, skipped: false } },
        }),
        (
            await prisma.asked.findFirst({
                orderBy: {
                    answers: { _count: 'desc' },
                },
                include: {
                    _count: { select: { answers: true } },
                },
            })
        )._count.answers,
    ])

    return {
        activeTeams,
        totalAsks,
        totalAnswers,
        biggestTeam,
    }
}
