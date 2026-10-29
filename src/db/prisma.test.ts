import { logger } from '@navikt/next-logger'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { expect, beforeAll, describe, test } from 'vitest'

import { migrateDb } from '../db2/migrate'

import { getTeam } from './team'

/**
 * These tests verify how the prisma database wrapper function operate today.
 *
 * They will later be executed against the drizzle implementation to verify that all the data,
 * joins and relations are working as expected.
 */
describe('prisma → prisma database verification tests', async () => {
    beforeAll(async () => {
        await new PostgreSqlContainer('postgres:18-alpine')
            .withDatabase('helsesjekk-bot')
            .start()
            .then(async (it) => {
                logger.info(`Postgres started!`)

                process.env.NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL = it.getConnectionUri()

                /**
                 * Because its easier and because prisma sucks, we'll run drizzles
                 * migrations, prisma will work with the tables anyway
                 */
                await migrateDb()

                return it
            })
    })

    test('sanity check database', async () => {
        const team = await getTeam('hey')

        expect(team).toBeNull()
    })
})
