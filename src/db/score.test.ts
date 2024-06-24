import { describe, expect, mock, test } from 'bun:test'
import type { Answer, Asked, Team } from '@prisma/client'
import { addWeeks } from 'date-fns'

import { questionsToJsonb } from '../questions/jsonb-utils'
import { getWeekNumber } from '../utils/date'
import { expectNoError } from '../../tests/utils'
import { testQuestions } from '../../tests/data'

import { getTeamScorePerQuestion, getTeamScoreTimeline } from './score'

import { AnswerLevel, AskedWithAnswers, QuestionAnswer } from './'

const TEAM = 'ex-team'
const HIGH = AnswerLevel.GOOD
const MID = AnswerLevel.MEDIUM
const LOW = AnswerLevel.BAD

describe('getTeamScoreTimeline', () => {
    const someTimeInMay = new Date('2023-05-05T10:00:00')

    test('simple case with all positive', async () => {
        mockDb([
            createAsk(someTimeInMay, [
                createAnswers([HIGH, HIGH, HIGH]),
                createAnswers([HIGH, HIGH, HIGH]),
                createAnswers([HIGH, HIGH, HIGH]),
            ]),
        ])

        const result = await getTeamScoreTimeline(TEAM)
        expectNoError(result)

        const firstWeek = result[0]
        expect(getWeekNumber(firstWeek.timestamp)).toEqual(18)
        expect(firstWeek.score).toEqual(5)
    })

    test('simple case with mixed responses', async () => {
        mockDb([
            createAsk(someTimeInMay, [
                createAnswers([HIGH, MID, LOW]),
                createAnswers([HIGH, MID, LOW]),
                createAnswers([HIGH, MID, LOW]),
            ]),
        ])

        const result = await getTeamScoreTimeline(TEAM)
        expectNoError(result)

        const firstWeek = result[0]

        expect(getWeekNumber(firstWeek.timestamp)).toEqual(18)
        expect(firstWeek.score.toFixed(2)).toEqual('2.83')
    })
})

describe('getTeamScorePerQuestion', () => {
    const someTimeInMay = new Date('2023-05-05T10:00:00')

    test('correct distribution over multiple asks', async () => {
        mockDb([
            createAsk(someTimeInMay, [
                createAnswers([HIGH, MID, LOW]),
                createAnswers([HIGH, MID, LOW]),
                createAnswers([HIGH, MID, LOW]),
            ]),
            createAsk(addWeeks(someTimeInMay, 1), [
                createAnswers([HIGH, HIGH, HIGH]),
                createAnswers([HIGH, HIGH, HIGH]),
                createAnswers([HIGH, HIGH, HIGH]),
            ]),
        ])

        const result = await getTeamScorePerQuestion(TEAM)
        expectNoError(result)

        const [q1, q2, q3] = result

        expect(q1.scoring[0].averageScore).toEqual(5)
        expect(q1.scoring[0].distribution).toEqual({ GOOD: 3, MEDIUM: 0, BAD: 0 })
        expect(q1.scoring[1].averageScore).toEqual(5)
        expect(q1.scoring[1].distribution).toEqual({ GOOD: 3, MEDIUM: 0, BAD: 0 })

        expect(q2.scoring[0].averageScore).toEqual(2.5)
        expect(q2.scoring[0].distribution).toEqual({ GOOD: 0, MEDIUM: 3, BAD: 0 })
        expect(q2.scoring[1].averageScore).toEqual(5)
        expect(q2.scoring[1].distribution).toEqual({ GOOD: 3, MEDIUM: 0, BAD: 0 })

        expect(q3.scoring[0].averageScore).toEqual(1)
        expect(q3.scoring[0].distribution).toEqual({ GOOD: 0, MEDIUM: 0, BAD: 3 })
        expect(q3.scoring[1].averageScore).toEqual(5)
        expect(q3.scoring[1].distribution).toEqual({ GOOD: 3, MEDIUM: 0, BAD: 0 })
    })
})

function mockDb(asked: Asked[]): void {
    mock.module('./prisma.ts', () => ({
        prisma: () => ({
            team: {
                findFirst: () => createTeam(asked),
            },
        }),
    }))
}

function createTeam(asks: Asked[]): Team & { Asked: Asked[] } {
    return {
        id: TEAM,
        revealDay: 4,
        revealHour: 12,
        postDay: 4,
        postHour: 10,
        frequency: 1,
        weekSkew: 0,
        active: true,
        questions: questionsToJsonb(testQuestions),
        name: 'Test Team',
        assosiatedGroup: null,
        Asked: asks,
    }
}

function createAsk(answered: Date = new Date(), answers?: Answer[]): AskedWithAnswers {
    return {
        id: 1,
        teamId: TEAM,
        timestamp: answered,
        revealed: true,
        skipped: false,
        messageTs: '',
        nagged: false,
        questions: questionsToJsonb(testQuestions),
        answers: answers ?? [],
    }
}

function createAnswers(answers: [AnswerLevel, AnswerLevel, AnswerLevel]): Answer {
    return {
        userId: 'test-user',
        answeredAt: new Date(),
        askedId: 1,
        answers: answers.map(
            (ans, index) =>
                ({
                    questionId: testQuestions[index].questionId,
                    type: testQuestions[index].type,
                    answer: ans,
                }) satisfies QuestionAnswer,
        ),
    }
}
