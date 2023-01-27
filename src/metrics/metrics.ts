import * as R from 'remeda'
import { Answer, Asked } from '@prisma/client'

import { answerFromJsonb, questionsFromJsonb } from '../questions/jsonb-utils'
import { AnswerLevel, QuestionAnswer } from '../db'

export interface ScoredQuestion {
    score: number
    question: string
}

export function scoreQuestions(asked: Asked & { answers: Answer[] }): ScoredQuestion[] {
    const questions = questionsFromJsonb(asked.questions)

    const answersByQuestionId = R.pipe(
        asked.answers,
        R.map(R.prop('answers')),
        R.flatMap(answerFromJsonb),
        R.groupBy(R.prop('questionId')),
    )

    return questions.map((it) => {
        const answers = answersByQuestionId[it.questionId]
        const score = R.pipe(answers, R.map(answerToValue), R.sumBy(R.identity), (it) => it / answers.length)

        return {
            question: it.question,
            score,
        }
    })
}

export function overallScore(scoredQuestions: ScoredQuestion[]): number {
    return R.pipe(scoredQuestions, R.map(R.prop('score')), R.sumBy(R.identity), (it) => it / scoredQuestions.length)
}

function answerToValue(answer: QuestionAnswer): number {
    switch (answer.answer) {
        case AnswerLevel.GOOD:
            return 5
        case AnswerLevel.MEDIUM:
            return 2.5
        case AnswerLevel.BAD:
            return 1
    }
}
