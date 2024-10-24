import { NextResponse } from 'next/server'
import { notFound } from 'next/navigation'

import { bot } from '../bot'

export async function POST(): Promise<NextResponse> {
    if (process.env.NODE_ENV !== 'development') {
        notFound()
    }

    console.warn('Local dev mode: Restarting bot')

    // Shut down existing bot
    await (await bot()).stop()
    // Reset singleton
    bot.reset()
    // Restart bot
    await bot()

    return NextResponse.json({ message: 'Bot restarted' })
}
