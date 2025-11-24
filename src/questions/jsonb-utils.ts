import { JsonArray, JsonValue } from '@prisma/client/runtime/client'

import { QuestionAnswer } from '../db'
import { Question } from '../safe-types'

export function questionsToJsonb(questions: Question[]): JsonArray {
    return questions as unknown as JsonArray
}

// TODO: zod it?
export function questionsFromJsonb(questionJson: JsonValue): Question[] {
    return questionJson as unknown as Question[]
}

export function answerToJsonb(answer: QuestionAnswer[]): JsonArray {
    return answer as unknown as JsonArray
}

// TODO: zod it?
export function answerFromJsonb(questionJson: JsonValue): QuestionAnswer[] {
    return questionJson as unknown as QuestionAnswer[]
}
