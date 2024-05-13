import * as R from 'remeda'
import { getYear } from 'date-fns'

import { scoreAsked, ScoredAsk, ScoredQuestion } from '../metrics/metrics'
import { getWeekNumber } from '../utils/date'
import { QuestionScorePerWeek, QuestionType } from '../safe-types'

import { prisma } from './prisma'

export async function getTeamScoreTimeline(teamId: string): Promise<
    | {
          timestamp: Date
          score: number
          answers: number
      }[]
    | { error: string }
> {
    const team = await prisma().team.findFirst({
        where: { active: true, id: teamId },
        include: {
            Asked: {
                where: { revealed: true, skipped: false },
                include: { answers: true },
            },
        },
    })

    if (team == null) {
        return {
            error: 'Fant ikke ditt team',
        }
    }

    if (team.Asked.length === 0) {
        return {
            error: 'Teamet ditt har ingen spørringer enda.',
        }
    }

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

export async function getTeamScorePerQuestion(teamId: string): Promise<QuestionScorePerWeek[] | { error: string }> {
    const team = await prisma().team.findFirst({
        where: { active: true, id: teamId },
        include: {
            Asked: {
                where: { revealed: true, skipped: false },
                include: { answers: true },
            },
        },
    })

    if (team == null) {
        return {
            error: 'Fant ikke ditt team',
        }
    }

    if (team.Asked.length === 0) {
        return {
            error: 'Teamet ditt har ingen spørringer enda.',
        }
    }

    const scoredAsks = R.pipe(
        team.Asked,
        // This seems like a bug in the database, where an Asked is not "skipped", but has no answers
        R.filter((asked) => asked.answers.length > 0),
        R.map(scoreAsked),
    )

    const scoredQuestionToScorePerWeek = (
        scoredQuestion: ScoredQuestion & { timestamp: Date },
    ): QuestionScorePerWeek => ({
        question: {
            questionId: scoredQuestion.id,
            question: scoredQuestion.question,
            answers: scoredQuestion.answers,
        },
        scoring: [
            {
                timestamp: scoredQuestion.timestamp,
                averageScore: scoredQuestion.score,
                distribution: scoredQuestion.distribution,
            },
        ],
    })

    const questionScorePerWeek = R.pipe(
        scoredAsks,
        R.flatMap(({ timestamp, scoredQuestions }) => scoredQuestions.map((question) => ({ ...question, timestamp }))),
        R.map(scoredQuestionToScorePerWeek),
        R.reduce(
            (acc, it) => {
                const existing = acc[it.question.questionId]
                acc[it.question.questionId] = existing
                    ? { ...existing, scoring: [...existing.scoring, ...it.scoring] }
                    : it
                return acc
            },
            {} as Record<string, QuestionScorePerWeek>,
        ),
        R.values,
        R.map((it) => ({
            ...it,
            scoring: R.pipe(
                it.scoring,
                R.sortBy((it) => it.timestamp),
            ),
        })),
    )
    return questionScorePerWeek
}

export async function getGlobalScoreTimeline(): Promise<
    ({
        timestamp: Date
        score: number
        answers: number
    } & Record<QuestionType, number>)[]
> {
    const completedAsks = await prisma().asked.findMany({
        where: { revealed: true, skipped: false, team: { active: true } },
        include: { answers: true },
    })

    const scoresPerWeek = R.pipe(
        completedAsks,
        R.filter((asked) => asked.answers.length > 0),
        R.sortBy(R.prop('timestamp')),
        R.groupBy((it) => `${getYear(it.timestamp)}-${getWeekNumber(it.timestamp)}`),
        R.toPairs,
        R.fromPairs.strict,
        R.mapValues(R.map(scoreAsked)),
        R.mapValues((scoredAsks) => {
            const sum = R.sumBy(scoredAsks, R.prop('totalScore'))
            const scorePerCategory = R.pipe(
                scoredAsks,
                R.flatMap((it) => it.scoredQuestions),
                R.groupBy.strict(R.prop('type')),
                R.mapValues((it) => {
                    // @ts-expect-error TODO: improve typing
                    const sum = R.sumBy(it, R.prop('score'))
                    // @ts-expect-error TODO: improve typing
                    return sum / it.length
                }),
            )

            return {
                timestamp: scoredAsks[0].timestamp,
                score: sum / scoredAsks.length,
                answers: R.sumBy(scoredAsks, (it) => it.answerCount),
                ...scorePerCategory,
            }
        }),
        R.values,
    )

    return scoresPerWeek
}

export async function getTeamsScoredAsks(teamId: string): Promise<ScoredAsk[]> {
    const asks = await prisma().asked.findMany({
        where: { teamId, revealed: true, skipped: false },
        include: {
            answers: true,
        },
    })

    return R.pipe(
        asks,
        R.filter((asked) => asked.answers.length >= 3),
        R.map(scoreAsked),
        R.sortBy([R.prop('timestamp'), 'desc']),
    )
}
