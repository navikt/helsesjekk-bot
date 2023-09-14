import { PrismaClient } from '@prisma/client'

import logger from '../logger'

export const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
    ],
})

prisma.$on('error', (e) => {
    logger.error(e)
})

prisma.$on('warn', (e) => {
    logger.error(e)
})

export async function isReady(): Promise<boolean> {
    try {
        await prisma.$connect()
        return true
    } catch (e) {
        logger.error(new Error('Unable to connect to database', { cause: e }))
        return false
    }
}

export * from '@prisma/client'
