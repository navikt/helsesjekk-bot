import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '../../../../utils/env'

import { bot, botStatus } from './bot'

export const dynamic = 'force-dynamic'

export function GET(): NextResponse {
    try {
        // Validate that all required envs are set
        getServerEnv()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'Some envs are not set correctly' }, { status: 500 })
    }

    if (!botStatus.ready) {
        if (!botStatus.started) {
            botStatus.started = true
            bot()
                .then(() => {
                    logger.info('Bot started')
                    botStatus.ready = true
                })
                .catch((error) => {
                    logger.error('Bot failed to start')
                    logger.error(error)
                    botStatus.ready = false
                })
        }

        return NextResponse.json({ message: 'Slack bot not ready yet' }, { status: 423 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
