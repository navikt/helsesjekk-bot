import * as R from 'remeda'
import { Answer } from '@prisma/client'

import { answerFromJsonb, questionsFromJsonb } from '../questions/jsonb-utils'
import { AnswerLevel, AskedWithAnswers, QuestionAnswer } from '../db'
import { QuestionType } from '../safe-types'

export interface ScoredQuestion {
    id: string
    score: number
    question: string
    type: QuestionType
}

export type ScoredAsk = {
    totalScore: number
    scoredQuestions: ScoredQuestion[]
    answerCount: number
    timestamp: Date
    messageTs: string
}

export function scoreAsked(asked: AskedWithAnswers): ScoredAsk {
    const questions = questionsFromJsonb(asked.questions)

    const answersByQuestionId = groupAnswersByQuestionId(asked.answers)
    const scoredQuestions = questions.map((it) => {
        const answers = answersByQuestionId[it.questionId]
        const score = scoreAnswers(answers)

        return {
            id: it.questionId,
            question: it.question,
            score,
            type: it.type,
        }
    })

    return {
        totalScore: overallScore(scoredQuestions),
        scoredQuestions,
        answerCount: asked.answers.length,
        timestamp: asked.timestamp,
        messageTs: asked.messageTs,
    }
}

const groupAnswersByQuestionId: (answers: Answer[]) => Record<string, QuestionAnswer[]> = R.createPipe(
    R.map(R.prop('answers')),
    R.flatMap(answerFromJsonb),
    R.groupBy(R.prop('questionId')),
)

const scoreAnswers = (answers: QuestionAnswer[]): number =>
    R.pipe(answers, R.map(answerToValue), R.sumBy(R.identity), (it) => it / answers.length)

function overallScore(scoredQuestions: ScoredQuestion[]): number {
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
