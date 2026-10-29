import { QuestionAnswer } from '../db'
import { Question } from '../safe-types'

export function questionsToJsonb(questions: Question[]): unknown[] {
    return questions as unknown[]
}

// TODO: zod it?
export function questionsFromJsonb(questionJson: unknown): Question[] {
    return questionJson as unknown as Question[]
}

export function answerToJsonb(answer: QuestionAnswer[]): unknown[] {
    return answer as unknown[]
}

// TODO: zod it?
export function answerFromJsonb(questionJson: unknown): QuestionAnswer[] {
    return questionJson as unknown as QuestionAnswer[]
}
