import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'

import { startBot } from '../../../../bot'
import { getServerEnv } from '../../../../utils/env'

export const dynamic = 'force-dynamic'

let botReady = false
let botStarted = false

export function GET(): NextResponse {
    try {
        // Validate that all required envs are set
        getServerEnv()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'Some envs are not set correctly' }, { status: 500 })
    }

    if (!botReady) {
        if (!botStarted) {
            botStarted = true
            startBot()
                .then(() => {
                    botReady = true
                })
                .catch((error) => {
                    logger.error(error)
                    botStarted = false
                })
        }

        return NextResponse.json({ message: 'Slack bot not ready yet' }, { status: 423 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
