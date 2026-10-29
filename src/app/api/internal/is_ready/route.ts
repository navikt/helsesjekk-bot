import { logger } from '@navikt/next-logger'
import { NextResponse } from 'next/server'
import { nextleton } from 'nextleton'

import { migrateDb } from '../../../../db2/migrate'
import { getServerEnv } from '../../../../utils/env'

import { bot } from './bot'

const migrationStatus = nextleton('migration-status', () => ({
    doing: false,
    executed: false,
}))

const botStarted = nextleton('bot-started', () => ({
    doing: false,
    executed: false,
}))

export async function GET(): Promise<NextResponse> {
    try {
        // Validate that all required envs are set
        getServerEnv()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'Some envs are not set correctly' }, { status: 500 })
    }

    try {
        if (migrationStatus.doing || botStarted.doing) {
            return NextResponse.json(
                { message: 'I am not ready, waiting for migration/bot in another request!' },
                { status: 423 },
            )
        }

        if (!migrationStatus.executed && !migrationStatus.doing) {
            migrationStatus.doing = true
            await migrateDb()
                .then(() => {
                    migrationStatus.executed = true
                })
                .finally(() => {
                    migrationStatus.doing = false
                })
        }

        if (!botStarted.executed && !botStarted.doing) {
            botStarted.doing = true
            await bot()
                .then(() => {
                    botStarted.executed = true
                })
                .finally(() => {
                    botStarted.doing = false
                })
        }
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'I am not ready, something failed :(' }, { status: 500 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
