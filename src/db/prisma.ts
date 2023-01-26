import { PrismaClient } from '@prisma/client'

import logger from '../logger'

export const prisma = new PrismaClient()

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
