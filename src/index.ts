import { App } from '@slack/bolt'
import { Logger, LogLevel } from '@slack/logger'
import logger from './logger'
import { config } from 'dotenv'
import { isReady } from './db/prisma'

if (process.env.NODE_ENV !== 'production') {
    // Load dev environment variables
    config({})
}

const slackLogger = logger.child({ x_isSlack: true })

const loggerAdapter: Logger = {
    debug: (msg) => slackLogger.debug(msg),
    info: (msg) => slackLogger.info(msg),
    warn: (msg) => slackLogger.warn(msg),
    error: (msg) => slackLogger.error(msg),
    getLevel: (): LogLevel => slackLogger.level as LogLevel,
    setLevel: (): void => void 0,
    setName: (): void => void 0,
}

// Initialize Bolt app, using the default HTTPReceiver
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logger: loggerAdapter,
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

// Listens for messages containing "knock knock" and responds with an italicized "who's there?"
app.message('knock knock', async ({ message, say }) => {
    logger.info(JSON.stringify(message))
    await say(`_Who's there?_`)
})

async function start() {
    const port = process.env.PORT || 5000
    await app.start(port)
    logger.info(`Started bolt app on port ${port}`)
}

start()
