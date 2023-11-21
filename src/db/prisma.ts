import { PrismaClient } from '@prisma/client'
import { nextleton } from 'nextleton'

export const prisma = nextleton(
    'prisma',
    () =>
        new PrismaClient({
            log: [
                { emit: 'event', level: 'warn' },
                { emit: 'event', level: 'error' },
            ],
        }),
)

prisma.$on('error', (e) => {
    console.error(e)
})

prisma.$on('warn', (e) => {
    console.error(e)
})

export async function isReady(): Promise<boolean> {
    try {
        await prisma.$connect()
        return true
    } catch (e) {
        console.error(new Error('Unable to connect to database', { cause: e }))
        return false
    }
}

export * from '@prisma/client'
