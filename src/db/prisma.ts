import { PrismaClient } from '@prisma/client'
import { lazyNextleton } from 'nextleton'

export const prisma = lazyNextleton('prisma', () => {
    const client = new PrismaClient({
        log: [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
        ],
    })

    client.$on('error', (e) => {
        console.error(e)
    })

    client.$on('warn', (e) => {
        console.error(e)
    })

    return client
})

export * from '@prisma/client'
