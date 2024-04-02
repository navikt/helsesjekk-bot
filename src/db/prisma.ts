import { PrismaClient } from '@prisma/client'
import { logger } from '@navikt/next-logger'
import { lazyNextleton } from 'nextleton'

export const prisma = lazyNextleton('prisma', () => {
    const client = new PrismaClient({
        log: [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
        ],
    })

    client.$on('error', (e) => {
        logger.error(e)
    })

    client.$on('warn', (e) => {
        logger.error(e)
    })

    return client
})

export * from '@prisma/client'
