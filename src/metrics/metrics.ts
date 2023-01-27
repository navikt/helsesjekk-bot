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

// Score to red/yellow/green emoji
function scoreToEmoji(score: number): string {
    if (score < 2) {
        return ':red_circle:'
    } else if (score < 4) {
        return ':yellow_circle:'
    } else {
        return ':green_circle:'
    }
}
