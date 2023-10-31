import { logger } from '@navikt/next-logger'

export const botLogger = logger.child({ x_context: 'slack-bot' })
