import { Logger, LogLevel } from '@slack/logger'
import { App as BoltApp } from '@slack/bolt'
import { lazyNextleton } from 'nextleton'
import { logger } from '@navikt/next-logger'

const slackLogger = logger.child({ x_context: 'slack-bot', x_isSlack: true })

// Custom logger adapter because Bolt didn't like the pino logger
const loggerAdapter: Logger = {
    debug: (msg) => slackLogger.debug(msg),
    info: (msg) => slackLogger.info(msg),
    warn: (msg) => slackLogger.warn(msg),
    error: (msg) => slackLogger.error(msg),
    getLevel: (): LogLevel => slackLogger.level as LogLevel,
    setLevel: (): void => void 0,
    setName: (): void => void 0,
}

const app = lazyNextleton(
    'bolt',
    () =>
        new BoltApp({
            socketMode: true,
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            appToken: process.env.SLACK_APP_TOKEN,
            logger: loggerAdapter,
        }),
)

export type App = BoltApp
export default app
