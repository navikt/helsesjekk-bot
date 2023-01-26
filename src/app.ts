import { Logger, LogLevel } from '@slack/logger'
import { App as BoltApp } from '@slack/bolt'

import logger from './logger'
import { isReady } from './db'

const slackLogger = logger.child({ x_isSlack: true })

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

const app = new BoltApp({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    logger: loggerAdapter,
    // The entire server is run by Slack's Bolt, so we define these custom routes to make nais happy
    customRoutes: [
        {
            path: '/internal/is_alive',
            method: ['GET'],
            handler: (req, res) => {
                res.writeHead(200)
                res.end('OK')
            },
        },
        {
            path: '/internal/is_ready',
            method: ['GET'],
            handler: async (req, res) => {
                if (await isReady()) {
                    res.writeHead(200)
                    res.end('OK')
                } else {
                    res.writeHead(503)
                    res.end('Not Ready')
                }
            },
        },
    ],
})

export type App = typeof app
export default app
