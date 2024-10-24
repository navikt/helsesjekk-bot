import { NextResponse } from 'next/server'

import { getServerEnv } from '../../../../utils/env'

import { bot, botStatus } from './bot'

export const dynamic = 'force-dynamic'

export function GET(): NextResponse {
    try {
        // Validate that all required envs are set
        getServerEnv()
    } catch (e) {
        console.error(e)
        return NextResponse.json({ message: 'Some envs are not set correctly' }, { status: 500 })
    }

    if (!botStatus.ready) {
        if (!botStatus.started) {
            botStatus.started = true
            bot()
                .then(() => {
                    console.info('Bot started')
                    botStatus.ready = true
                })
                .catch((error) => {
                    console.error('Bot failed to start')
                    console.error(error)
                    botStatus.ready = false
                })
        }

        return NextResponse.json({ message: 'Slack bot not ready yet' }, { status: 423 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
