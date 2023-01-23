import { Prisma } from '@prisma/client'

import { Question } from '../db/types'

export function toJsonb(questions: Question[]): Prisma.JsonArray {
    return questions as unknown as Prisma.JsonArray
}

// TODO: zod it?
export function fromJsonb(questionJson: Prisma.JsonValue): Question[] {
    return questionJson as unknown as Question[]
}
