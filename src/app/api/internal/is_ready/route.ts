import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'

import { startBot } from '../../../../bot'

export const dynamic = 'force-dynamic'

let botReady = false
let botStarted = false

export function GET(): NextResponse {
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
