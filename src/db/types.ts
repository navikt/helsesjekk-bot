import { Answer, Asked } from '@prisma/client'

import { QuestionType } from '../safe-types'

export enum Day {
    MONDAY = 0,
    TUESDAY = 1,
    WEDNESDAY = 2,
    THURSDAY = 3,
    FRIDAY = 4,
    SATURDAY = 5,
    SUNDAY = 6,
}

export interface QuestionAnswer {
    questionId: string
    answer: AnswerLevel
    type: QuestionType
}

export enum AnswerLevel {
    GOOD = 'GOOD',
    MEDIUM = 'MEDIUM',
    BAD = 'BAD',
}

export type AskedWithAnswers = Asked & { answers: Answer[] }
