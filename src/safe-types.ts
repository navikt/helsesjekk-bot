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
}
