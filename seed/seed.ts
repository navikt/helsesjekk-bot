import { logger } from '@navikt/next-logger'
import { setWeek } from 'date-fns'
import * as R from 'remeda'

import { AnswerLevel, Day, QuestionAnswer } from '../src/db/types'
import { drizzle } from '../src/db2/db'
import { answer, asked, team } from '../src/db2/schema'
import { defaultQuestions } from '../src/questions/default'
import { Question, QuestionType } from '../src/safe-types'

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

const db = drizzle()

await db.delete(answer)
await db.delete(asked)
await db.delete(team)

const activeTeamQuestions: Question[] = [
    ...defaultQuestions(),
    {
        questionId: crypto.randomUUID(),
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
]

const [activeTeam] = await db
    .insert(team)
    .values({
        id: 'test-id-1',
        name: 'Seeded Active Team',
        active: true,
        postDay: Day.FRIDAY,
        postHour: 14,
        revealDay: Day.MONDAY,
        revealHour: 10,
        questions: activeTeamQuestions,
        assosiatedGroup: 'fake-group',
    })
    .returning()

await db.insert(team).values({
    id: 'test-id-2',
    name: 'Seeded Inactive Team',
    active: false,
    postDay: Day.FRIDAY,
    postHour: 14,
    revealDay: Day.MONDAY,
    revealHour: 10,
    questions: defaultQuestions(),
    assosiatedGroup: null,
})

async function createAskWithNAnswers(
    week: number,
    count: number,
    optional: 'most' | 'not-enough' | 'none' = 'most',
): Promise<void> {
    const [ask] = await db
        .insert(asked)
        .values({
            teamId: activeTeam.id,
            messageTs: '1686224220.775259',
            timestamp: setWeek(new Date(2023, 0, 1, 13, 37), week + 1),
            questions: activeTeamQuestions,
            revealed: true,
            skipped: false,
            nagged: false,
        })
        .returning()

    const answers = R.range(0, count + 1).map((index) => ({
        index,
        shouldAnswerOptional: optional === 'most' ? index < count - 1 : optional === 'not-enough' ? index < 2 : false,
    }))

    await db.insert(answer).values(
        answers.map(({ index, shouldAnswerOptional }) => ({
            userId: `fake-user-${index}`,
            askedId: ask.id,
            answeredAt: ask.timestamp,
            answers: R.pipe(
                activeTeamQuestions,
                R.filter((q) => {
                    const required = q.required ?? true

                    if (required) return true
                    return shouldAnswerOptional
                }),
                R.map((q): QuestionAnswer => ({
                    questionId: q.questionId,
                    answer: getRandomAnswerLevel(),
                    type: q.type,
                })),
            ),
        })),
    )
}

await createAskWithNAnswers(1, 7)
await createAskWithNAnswers(2, 8)
await createAskWithNAnswers(3, 5, 'not-enough')
await createAskWithNAnswers(4, 7, 'none')
await createAskWithNAnswers(5, 7, 'none')
await createAskWithNAnswers(6, 8)
await createAskWithNAnswers(7, 6)

await db.$client.end()

logger.info('Database seeded.')
