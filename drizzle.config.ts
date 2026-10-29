// oxlint-disable typescript/no-non-null-assertion

import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: './drizzle',
    schema: './src/db/drizzle/*.ts',
    dialect: 'postgresql',
    tablesFilter: ['!_prisma_migrations'],
    dbCredentials: {
        url: process.env.NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL!,
    },
    migrations: { schema: 'public' },
})
