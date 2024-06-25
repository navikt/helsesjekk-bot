import * as R from 'remeda'
import { Answer } from '@prisma/client'

import { answerFromJsonb, questionsFromJsonb } from '../questions/jsonb-utils'
import { AnswerLevel, AskedWithAnswers, QuestionAnswer } from '../db'
import { QuestionScoreDistributrion, QuestionType } from '../safe-types'

export interface ScoredQuestion {
    id: string
    score: number
    question: string
    answers: Record<AnswerLevel, string>
    type: QuestionType
    distribution: QuestionScoreDistributrion
    answerCount: number
    optional: boolean
}

export type ScoredAsk = {
    totalScore: number
    scoredQuestions: ScoredQuestion[]
    answerCount: number
    timestamp: Date
    messageTs: string
}

function getAnswersByLevel(answers: QuestionAnswer[], answerLevel: AnswerLevel): number {
    return answers.filter((it) => it.answer === answerLevel).length
}

export function scoreAsked(asked: AskedWithAnswers): ScoredAsk {
    const questions = questionsFromJsonb(asked.questions)
    const answersByQuestionId = groupAnswersByQuestionId(asked.answers)
    const scoredQuestions = R.pipe(
        questions,
        R.map((it) => {
            const answers: QuestionAnswer[] | null = answersByQuestionId[it.questionId]
            const required = it.required ?? true
            if (!required && (answers == null || answers.length < 3)) {
                // Optional question with 0-3 answers
                return {
                    id: it.questionId,
                    question: it.question,
                    answers: {
                        [AnswerLevel.GOOD]: it.answers['HIGH'],
                        [AnswerLevel.MEDIUM]: it.answers['MID'],
                        [AnswerLevel.BAD]: it.answers['LOW'],
                    },
                    distribution: {
                        [AnswerLevel.GOOD]: null,
                        [AnswerLevel.MEDIUM]: null,
                        [AnswerLevel.BAD]: null,
                    },
                    type: it.type,
                    score: 0,
                    answerCount: answers?.length ?? 0,
                    optional: true,
                } satisfies ScoredQuestion
            }

            const score = scoreAnswers(answers)

            return {
                id: it.questionId,
                question: it.question,
                answers: {
                    [AnswerLevel.GOOD]: it.answers['HIGH'],
                    [AnswerLevel.MEDIUM]: it.answers['MID'],
                    [AnswerLevel.BAD]: it.answers['LOW'],
                },
                score,
                type: it.type,
                distribution: {
                    [AnswerLevel.GOOD]: getAnswersByLevel(answers, AnswerLevel.GOOD),
                    [AnswerLevel.MEDIUM]: getAnswersByLevel(answers, AnswerLevel.MEDIUM),
                    [AnswerLevel.BAD]: getAnswersByLevel(answers, AnswerLevel.BAD),
                },
                answerCount: answers.length,
                optional: !required,
            } satisfies ScoredQuestion
        }),
    )

    return {
        totalScore: overallScore(scoredQuestions),
        scoredQuestions,
        answerCount: asked.answers.length,
        timestamp: asked.timestamp,
        messageTs: asked.messageTs,
    }
}

const groupAnswersByQuestionId: (answers: Answer[]) => Record<string, QuestionAnswer[]> = R.piped(
    R.map(R.prop('answers')),
    R.flatMap(answerFromJsonb),
    R.groupBy(R.prop('questionId')),
)

const scoreAnswers = (answers: QuestionAnswer[]): number => {
    return R.pipe(answers, R.map(answerToValue), R.sumBy(R.identity()), (it) => it / answers.length)
}

function overallScore(scoredQuestions: ScoredQuestion[]): number {
    const actualQuestions = scoredQuestions.filter((it) => it.answerCount >= 3)

    return R.pipe(actualQuestions, R.map(R.prop('score')), R.sumBy(R.identity()), (it) => it / actualQuestions.length)
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
