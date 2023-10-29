import { Prisma, QuestionAnswer } from '../db'
import { Question } from '../safe-types'

export function questionsToJsonb(questions: Question[]): Prisma.JsonArray {
    return questions as unknown as Prisma.JsonArray
}

// TODO: zod it?
export function questionsFromJsonb(questionJson: Prisma.JsonValue): Question[] {
    return questionJson as unknown as Question[]
}

export function answerToJsonb(answer: QuestionAnswer[]): Prisma.JsonArray {
    return answer as unknown as Prisma.JsonArray
}

// TODO: zod it?
export function answerFromJsonb(questionJson: Prisma.JsonValue): QuestionAnswer[] {
    return questionJson as unknown as QuestionAnswer[]
}
