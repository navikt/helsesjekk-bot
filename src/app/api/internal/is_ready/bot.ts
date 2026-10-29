import { lazyNextleton } from 'nextleton'

import { createBot } from '../../../../bot'

export const bot = lazyNextleton('bot', () => createBot())
