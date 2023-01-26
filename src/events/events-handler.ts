import { App } from '../app'
import logger from '../logger'
import { deactivateTeam } from '../db/prisma'

export function configureEventsHandler(app: App): void {
    app.event('channel_left', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because bot was removed from channel.`)
        await deactivateTeam(event.channel)
    })

    app.event('group_left', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because bot was removed from channel.`)
        await deactivateTeam(event.channel)
    })
}
