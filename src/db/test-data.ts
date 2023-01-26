import logger from '../logger'
import { defaultQuestions } from '../questions/default'
import { questionsToJsonb } from '../questions/jsonb-utils'

import { prisma } from './prisma'
import { Day } from './types'

export async function createTestData() {
    if ((await prisma.team.findFirst()) != null) {
        logger.warn('Already has testdata, skipping')
        return
    }

    await prisma.team.create({
        data: {
            id: 'C04LN8Q5BPT',
            name: 'Test Team',
            questions: questionsToJsonb(defaultQuestions()),
            active: true,
            postDay: Day.FRIDAY,
            postHour: 14,
            revealDay: Day.MONDAY,
            revealHour: 10,
        },
    })

    logger.info('Test data created')
}
