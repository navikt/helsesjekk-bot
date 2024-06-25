import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import { setWeek } from 'date-fns'
import { v4 as uuidV4 } from 'uuid'

import { AnswerLevel, Day, prisma, QuestionAnswer } from '../src/db'
import { answerToJsonb, questionsFromJsonb, questionsToJsonb } from '../src/questions/jsonb-utils'
import { defaultQuestions } from '../src/questions/default'
import { QuestionType } from '../src/safe-types.ts'

function getRandomAnswerLevel(): AnswerLevel {
    const random = Math.random()

    if (random < 0.33) {
        return AnswerLevel.BAD
    } else if (random < 0.66) {
        return AnswerLevel.MEDIUM
    } else {
        return AnswerLevel.GOOD
    }
}

logger.info('Seeding database...')

await prisma().answer.deleteMany({ where: {} })
await prisma().asked.deleteMany({ where: {} })
await prisma().team.deleteMany({ where: {} })
const activeTeam = await prisma().team.create({
    data: {
        id: 'test-id-1',
        name: 'Seeded Active Team',
        active: true,
        postDay: Day.FRIDAY,
        postHour: 14,
        revealDay: Day.MONDAY,
        revealHour: 10,
        questions: questionsToJsonb([
            ...defaultQuestions(),
            {
                questionId: uuidV4(),
                question: 'Kodekvalitet',
                answers: {
                    HIGH: 'Kodekvaliteten er på topp!',
                    MID: 'Det kunne vært ryddet litt mer',
                    LOW: 'Det er helt dritt :(',
                },
                type: QuestionType.TECH,
                required: false,
                custom: true,
            },
        ]),
        assosiatedGroup: 'fake-group',
    },
})

await prisma().team.create({
    data: {
        id: 'test-id-2',
        name: 'Seeded Inactive Team',
        active: false,
        postDay: Day.FRIDAY,
        postHour: 14,
        revealDay: Day.MONDAY,
        revealHour: 10,
        questions: questionsToJsonb(defaultQuestions()),
        assosiatedGroup: null,
    },
})

async function createAskWithNAnswers(
    week: number,
    count: number,
    optional: 'most' | 'not-enough' | 'none' = 'most',
): Promise<void> {
    const ask = await prisma().asked.create({
        data: {
            teamId: activeTeam.id,
            messageTs: '1686224220.775259',
            timestamp: setWeek(new Date(2023, 0, 1, 13, 37), week + 1),
            questions: questionsToJsonb(questionsFromJsonb(activeTeam.questions)),
            revealed: true,
            skipped: false,
            nagged: false,
        },
    })

    const answers = R.range(0, count + 1).map((index) => ({
        index,
        shouldAnswerOptional: optional === 'most' ? index < count - 1 : optional === 'not-enough' ? index < 2 : false,
    }))

    await prisma().answer.createMany({
        data: answers.map(({ index, shouldAnswerOptional }) => ({
            userId: `fake-user-${index}`,
            askedId: ask.id,
            answeredAt: ask.timestamp,
            answers: answerToJsonb(
                R.pipe(
                    questionsFromJsonb(ask.questions),
                    R.filter((q) => {
                        const required = q.required ?? true

                        if (required) return true
                        return shouldAnswerOptional
                    }),
                    R.map(
                        (q): QuestionAnswer => ({
                            questionId: q.questionId,
                            answer: getRandomAnswerLevel(),
                            type: q.type,
                        }),
                    ),
                ),
            ),
        })),
    })
}

await createAskWithNAnswers(1, 7)
await createAskWithNAnswers(2, 8)
await createAskWithNAnswers(3, 5, 'not-enough')
await createAskWithNAnswers(4, 7, 'none')
await createAskWithNAnswers(5, 7, 'none')
await createAskWithNAnswers(6, 8)
await createAskWithNAnswers(7, 6)

logger.info('Database seeded.')
