import { PrismaPg } from '@prisma/adapter-pg'
import { logger } from '@navikt/next-logger'
import { lazyNextleton } from 'nextleton'

import { getServerEnv } from '../utils/env'

import { PrismaClient } from './generated/client'

export const prisma = lazyNextleton('prisma', () => {
    const adapter = new PrismaPg({
        connectionString: getServerEnv().NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL,
    })
    const client = new PrismaClient({
        adapter,
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
