import { Answer, Asked } from '@prisma/client'

export enum Day {
    MONDAY = 0,
    TUESDAY = 1,
    WEDNESDAY = 2,
    THURSDAY = 3,
    FRIDAY = 4,
    SATURDAY = 5,
    SUNDAY = 6,
}

export interface Question {
    questionId: string
    question: string
    answers: {
        LOW: string
        MID: string
        HIGH: string
    }
    type: QuestionType
    custom?: boolean
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

export enum QuestionType {
    TEAM_HEALTH = 'TEAM_HEALTH',
    SPEED = 'SPEED',
    TECH = 'TECH',
    OTHER = 'OTHER',
}

export type AskedWithAnswers = Asked & { answers: Answer[] }
