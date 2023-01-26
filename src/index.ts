import { config } from 'dotenv'

import logger from './logger'
import app from './app'
import { configureMessageScheduler } from './messages/message-scheduler'
import { configureHealthCheckEventsHandler } from './events/healthcheck/healthcheck-event-handler'
import { configureSettingsEventsHandler } from './events/settings/settings-event-handler'
import { configureCommandsHandler } from './commands/commands-handler'
import { createTestData } from './db/test-data'
import { configureEventsHandler } from './events/events-handler'

if (process.env.NODE_ENV !== 'production') {
    // Load dev environment variables
    config({})
}

const handlers = [
    configureCommandsHandler,
    configureMessageScheduler,
    configureEventsHandler,
    configureSettingsEventsHandler,
    configureHealthCheckEventsHandler,
]

async function start() {
    handlers.forEach((handler) => handler(app))

    if (process.env.NODE_ENV !== 'production') {
        logger.info('Is running locally, creating test data')
        await createTestData()
    }

    const port = process.env.PORT || 5000
    await app.start(port)
    logger.info(`Started bolt app on port ${port}`)
}

start().catch((err) => {
    logger.error('Unhandled rejected promise in root.')
    logger.error(err)
    process.exit(1)
})
