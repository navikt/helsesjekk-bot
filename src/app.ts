import { Logger, LogLevel } from '@slack/logger'
import { App as BoltApp } from '@slack/bolt'

import logger from './logger'

const slackLogger = logger.child({ x_isSlack: true })

// Custom logger adapter because Bolt didn't like the pino logger
const loggerAdapter: Logger = {
    debug: (msg) => slackLogger.debug(msg),
    info: (msg) => slackLogger.info(msg),
    warn: (msg) => slackLogger.warn(msg),
    error: (msg) => slackLogger.error(msg),
    getLevel: (): LogLevel => LogLevel.DEBUG,
    setLevel: (): void => void 0,
    setName: (): void => void 0,
}

const app = new BoltApp({
    socketMode: true,
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    logger: loggerAdapter,
    logLevel: LogLevel.DEBUG,
})

export type App = typeof app
export default app
