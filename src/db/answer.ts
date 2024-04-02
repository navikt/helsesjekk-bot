import { answerToJsonb, questionsFromJsonb } from '../questions/jsonb-utils'
import { Question } from '../safe-types'

import { Answer, Asked, prisma } from './prisma'
import { AnswerLevel, QuestionAnswer } from './types'

function mapToAnswers(answers: [questionId: string, value: string][], questions: Question[]): QuestionAnswer[] {
    return answers.map(([questionId, value]) => {
        const question = questions.find((question) => question.questionId === questionId)

        if (question == null) {
            throw new Error(`Unable to find question with id ${questionId}`)
        }

        return {
            answer: value as AnswerLevel,
            questionId: question.questionId,
            type: question.type,
        }
    })
}

export async function answerQuestions(
    asked: Asked,
    answers: [questionId: string, value: string][],
    userId: string,
): Promise<void> {
    const mappedAnswers = answerToJsonb(mapToAnswers(answers, questionsFromJsonb(asked.questions)))
    await prisma().answer.upsert({
        create: {
            userId,
            askedId: asked.id,
            answeredAt: new Date(),
            answers: mappedAnswers,
        },
        update: {
            answers: mappedAnswers,
        },
        where: {
            userId_askedId: {
                userId,
                askedId: asked.id,
            },
        },
    })
}

export async function getAnswer(userId: string, askedId: number): Promise<Answer | null> {
    return prisma().answer.findFirst({
        where: { userId: userId, askedId: askedId },
    })
}
