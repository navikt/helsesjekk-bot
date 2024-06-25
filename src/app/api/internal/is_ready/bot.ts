import { lazyNextleton, nextleton } from 'nextleton'

import { startBot } from '../../../../bot'

export const botStatus = nextleton('bot-status', () => ({
    started: false,
    ready: false,
}))
export const bot = lazyNextleton('bot', () => startBot())
