export enum QuestionType {
    TEAM_HEALTH = 'TEAM_HEALTH',
    SPEED = 'SPEED',
    TECH = 'TECH',
    OTHER = 'OTHER',
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
    /**
     * Whether this question is required to be answered by the user.
     *
     * @default true
     */
    required?: boolean
}

export type QuestionScoring = {
    timestamp: Date
    averageScore: number | null
    distribution: QuestionScoreDistributrion
}

export type QuestionScoreDistributrion = Record<AnswerLevel, number | null>

export enum AnswerLevel {
    GOOD = 'GOOD',
    MEDIUM = 'MEDIUM',
    BAD = 'BAD',
}

export type QuestionScorePerWeek = {
    question: {
        questionId: string
        question: string
        answers: Record<AnswerLevel, string>
    }
    scoring: QuestionScoring[]
}
