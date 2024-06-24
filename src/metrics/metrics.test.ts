import { describe, expect, test } from 'bun:test'
import type { Answer } from '@prisma/client'

import { AnswerLevel, AskedWithAnswers, QuestionAnswer } from '../db'
import { questionsToJsonb } from '../questions/jsonb-utils'
import { testQuestions } from '../../tests/data'

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
        expect(scored.scoredQuestions).toHaveLength(3)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(5.0)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(3.33)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(2)
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
        expect(scored.scoredQuestions).toHaveLength(3)
        expect(+scored.scoredQuestions[0].score.toFixed(2)).toEqual(2.5)
        expect(+scored.scoredQuestions[1].score.toFixed(2)).toEqual(2)
        expect(+scored.scoredQuestions[2].score.toFixed(2)).toEqual(1)
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
