import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    datasource: {
        url: env('NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL'),
    },
})
