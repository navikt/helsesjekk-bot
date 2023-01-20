import { PrismaClient } from '@prisma/client'
import logger from '../logger'

const prisma = new PrismaClient()

function answerQuestion(userId: string, channelId: string): void {
    return
}

export async function isReady(): Promise<boolean> {
    try {
        await prisma.$connect()
        return true
    } catch (e) {
        logger.error(new Error('Unable to connect to database', { cause: e }))
        return false
    }
}
