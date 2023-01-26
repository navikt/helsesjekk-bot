import { config } from 'dotenv'

import logger from './logger'
import app from './app'
import { configureAnswersHandlers } from './answers/answers-handler'
import { configureMessageScheduler } from './messages/message-scheduler'
import { createTestData } from './db/test-data'
import { configureEventsHandler } from './events/events-handler'

if (process.env.NODE_ENV !== 'production') {
    // Load dev environment variables
    config({})
}

async function start() {
    configureEventsHandler(app)
    configureAnswersHandlers(app)
    configureMessageScheduler(app)

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
