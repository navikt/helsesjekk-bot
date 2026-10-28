import createApp, { App } from './app'
import { botLogger } from './bot-logger'
import { configureCommandsHandler } from './commands/commands-handler'
import { configureEventsHandler } from './events/events-handler'
import { configureHealthCheckEventsHandler } from './events/healthcheck/healthcheck-event-handler'
import { configureSettingsEventsHandler } from './events/settings/settings-event-handler'
import { configureMessageScheduler } from './messages/message-scheduler'

const handlers = [
    configureCommandsHandler,
    configureMessageScheduler,
    configureEventsHandler,
    configureSettingsEventsHandler,
    configureHealthCheckEventsHandler,
]

export async function createBot(): Promise<App> {
    botLogger.info('Setting up bolt app...')

    const app = createApp()
    handlers.forEach((handler) => handler(app))
    await app.start()

    botLogger.info(`Started bolt app in socket mode`)

    return app
}
