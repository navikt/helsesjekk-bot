import { config } from 'dotenv'

if (process.env.NODE_ENV !== 'production') {
    // Load dev environment variables
    config({})
}

import logger from './logger'
import app from './app'
import { configureMessageScheduler } from './messages/message-scheduler'
import { configureHealthCheckEventsHandler } from './events/healthcheck/healthcheck-event-handler'
import { configureSettingsEventsHandler } from './events/settings/settings-event-handler'
import { configureCommandsHandler } from './commands/commands-handler'
import { configureEventsHandler } from './events/events-handler'
import { configureNaisHealthEndpoints } from './health'

const handlers = [
    configureCommandsHandler,
    configureMessageScheduler,
    configureEventsHandler,
    configureSettingsEventsHandler,
    configureHealthCheckEventsHandler,
]

async function start() {
    handlers.forEach((handler) => handler(app))

    await configureNaisHealthEndpoints()
    await app.start()
    logger.info(`Started bolt app in socket mode`)
}

start().catch((err) => {
    logger.error('Unhandled rejected promise in root.')
    logger.error(err)
    process.exit(1)
})
