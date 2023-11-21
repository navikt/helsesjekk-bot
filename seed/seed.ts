import * as R from 'remeda'
import { setWeek } from 'date-fns'

import { AnswerLevel, Day, prisma, QuestionAnswer } from '../src/db'
import { answerFromJsonb, answerToJsonb, questionsFromJsonb, questionsToJsonb } from '../src/questions/jsonb-utils'
import { defaultQuestions } from '../src/questions/default'

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

console.info('Seeding database...')

await prisma.answer.deleteMany({ where: {} })
await prisma.asked.deleteMany({ where: {} })
await prisma.team.deleteMany({ where: {} })
const activeTeam = await prisma.team.create({
    data: {
        id: 'test-id-1',
        name: 'Seeded Active Team',
        active: true,
        postDay: Day.FRIDAY,
        postHour: 14,
        revealDay: Day.MONDAY,
        revealHour: 10,
        questions: questionsToJsonb(defaultQuestions()),
        assosiatedGroup: 'fake-group',
    },
})

await prisma.team.create({
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

async function createAskWithNAnswers(week: number, count: number): Promise<void> {
    const ask = await prisma.asked.create({
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

    await prisma.answer.createMany({
        data: R.range(0, count + 1).map((index) => ({
            userId: `fake-user-${index}`,
            askedId: ask.id,
            answeredAt: ask.timestamp,
            answers: answerToJsonb(
                answerFromJsonb(ask.questions).map(
                    (q): QuestionAnswer => ({
                        questionId: q.questionId,
                        answer: getRandomAnswerLevel(),
                        type: q.type,
                    }),
                ),
            ),
        })),
    })
}

await createAskWithNAnswers(1, 7)
await createAskWithNAnswers(2, 8)
await createAskWithNAnswers(3, 5)
await createAskWithNAnswers(4, 7)

console.info('Database seeded.')
