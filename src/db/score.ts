import * as R from 'remeda'

import { scoreQuestions, overallScore } from '../metrics/metrics'

import { prisma } from './prisma'

export async function getTeamScoreTimeline(): Promise<unknown> {
    const allTeams = await prisma.team.findMany({
        where: { active: true },
        include: {
            Asked: {
                // where: { timestamp: { gte: start, lte: end } },
                where: { revealed: true },
                include: { answers: true },
            },
        },
    })

    // console.log(JSON.stringify(allTeams, null, 2))
    const teamScoreTimeline = R.pipe(
        allTeams,
        R.map((it) => ({
            name: it.name,
            scores: R.map(it.Asked, (asked) => ({
                timestamp: asked.timestamp,
                score: R.pipe(asked, scoreQuestions, overallScore),
            })),
        })),
    )
    console.log(JSON.stringify(teamScoreTimeline, null, 2))

    return teamScoreTimeline
}
