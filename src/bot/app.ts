import { App as BoltApp } from '@slack/bolt'
import { lazyNextleton } from 'nextleton'
import { ProxyAgent } from 'proxy-agent';

const agent = new ProxyAgent();

const app = lazyNextleton(
    'bolt',
    () =>
        new BoltApp({
            socketMode: true,
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            appToken: process.env.SLACK_APP_TOKEN,
            agent: agent,
        }),
)

export type App = BoltApp
export default app
