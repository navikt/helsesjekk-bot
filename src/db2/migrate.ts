import { logger } from '@navikt/next-logger'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { drizzle } from './db'

export async function migrateDb(): Promise<void> {
    logger.info('Running database migrations...')

    const db = drizzle()
    await migrate(db, { migrationsFolder: './drizzle', migrationsSchema: 'public' })

    logger.info('Database migrations completed.')
}
