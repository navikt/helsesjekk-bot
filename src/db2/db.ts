import 'dotenv/config'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import { lazyNextleton } from 'nextleton'

import { getServerEnv } from '../utils/env'

export const drizzle = lazyNextleton('drizzle', () => {
    const db = pgDrizzle(getServerEnv().NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL)

    return db
})
