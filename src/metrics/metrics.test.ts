import { describe, expect, test } from 'bun:test'
import type { Answer } from '@prisma/client'

import { AnswerLevel, AskedWithAnswers, QuestionAnswer } from '../db'
import { questionsToJsonb } from '../questions/jsonb-utils'
import { testQuestions } from '../../tests/data'
import { addIf } from '../bot/events/modal-utils'

import { scoreAsked } from './metrics'

const TEAM = 'ex-team'

describe('scoreAsked', () => {
    const someTimeInMay = new Date('2023-05-05T10:00:00')

    test('shall score scores correctly', () => {
        const scored = scoreAsked(
            createAsk(someTimeInMay, [
                createAnswers([AnswerLevel.GOOD, AnswerLevel.GOOD, AnswerLevel.MEDIUM]),
                createAnswers([AnswerLevel.GOOD, AnswerLevel.MEDIUM, AnswerLevel.MEDIUM]),
                createAnswers([AnswerLevel.GOOD, AnswerLevel.MEDIUM, AnswerLevel.BAD]),
            ]),
        )

        expect(+scored.totalScore.toFixed(2)).toEqual(3.44)
        expect(scored.answerCount).toEqual(3)
        expect(scored.scoredQuestions).toHaveLength(4)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(5.0)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(3.33)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(2)
        expect(+scored.scoredQuestions[3].score.toFixed(2)).toEqual(0)
        expect(scored.scoredQuestions[3].answerCount).toEqual(0)
    })

    test('shall score scores correctly, part 2', () => {
        const scored = scoreAsked(
            createAsk(someTimeInMay, [
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD]),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD]),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.BAD, AnswerLevel.BAD]),
            ]),
        )

        expect(+scored.totalScore.toFixed(2)).toEqual(1.83)
        expect(scored.answerCount).toEqual(3)
        expect(scored.scoredQuestions).toHaveLength(4)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(2.5)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(2)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(1)
        expect(+scored.scoredQuestions[3].score.toFixed(2)).toEqual(0)
        expect(scored.scoredQuestions[3].answerCount).toEqual(0)
    })

    test('shall not score optional questions with only 2 answers', () => {
        const scored = scoreAsked(
            createAsk(someTimeInMay, [
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD]),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD], AnswerLevel.BAD),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.BAD, AnswerLevel.BAD], AnswerLevel.BAD),
            ]),
        )

        expect(+scored.totalScore.toFixed(2)).toEqual(1.83)
        expect(scored.answerCount).toEqual(3)
        expect(scored.scoredQuestions).toHaveLength(4)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(2.5)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(2)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(1)
        expect(+scored.scoredQuestions[3].score.toFixed(2)).toEqual(0)
        expect(scored.scoredQuestions[3].answerCount).toEqual(2)
    })

    test('shall score optional questions with 3 answers', () => {
        const scored = scoreAsked(
            createAsk(someTimeInMay, [
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD], AnswerLevel.BAD),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.MEDIUM, AnswerLevel.BAD], AnswerLevel.BAD),
                createAnswers([AnswerLevel.MEDIUM, AnswerLevel.BAD, AnswerLevel.BAD], AnswerLevel.BAD),
            ]),
        )

        expect(+scored.totalScore.toFixed(2)).toEqual(1.63)
        expect(scored.answerCount).toEqual(3)
        expect(scored.scoredQuestions).toHaveLength(4)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(2.5)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(2)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(1)
        expect(+scored.scoredQuestions[3].score.toFixed(2)).toEqual(1)
        expect(scored.scoredQuestions[3].answerCount).toEqual(3)
    })
})

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

function createAnswers(answers: [AnswerLevel, AnswerLevel, AnswerLevel], optional?: AnswerLevel): Answer {
    return {
        userId: 'test-user',
        answeredAt: new Date(),
        askedId: 1,
        answers: [
            ...answers.map(
                (ans, index) =>
                    ({
                        questionId: testQuestions[index].questionId,
                        type: testQuestions[index].type,
                        answer: ans,
                    }) satisfies QuestionAnswer,
            ),
            ...addIf(optional != null, () => ({
                questionId: testQuestions[3].questionId,
                type: testQuestions[3].type,
                answer: optional,
            })),
        ],
    }
}
