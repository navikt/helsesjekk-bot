import * as R from 'remeda'

import { scoreAsked } from '../metrics/metrics'

import { prisma } from './prisma'

export async function getTeamScoreTimeline(teamId: string): Promise<
    {
        timestamp: Date
        score: number
        answers: number
    }[]
> {
    const team = await prisma.team.findFirst({
        where: { active: true, id: teamId },
        include: {
            Asked: {
                where: { revealed: true, skipped: false },
                include: { answers: true },
            },
        },
    })

    const scores = R.sortBy(
        team.Asked
            // This seems like a bug in the database, where an Asked is not "skipped", but has no answers
            .filter((asked) => asked.answers.length > 0)
            .map((asked) => {
                const scoredAsk = scoreAsked(asked)
                return {
                    timestamp: asked.timestamp,
                    score: scoredAsk.totalScore,
                    answers: scoredAsk.answerCount,
                }
            }),
        R.prop('timestamp'),
    )

    return scores
}
