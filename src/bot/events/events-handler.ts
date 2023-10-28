import { logger } from '@navikt/next-logger'

import { App } from '../app'
import { deactivateTeam } from '../../db'

export function configureEventsHandler(app: App): void {
    app.event('channel_archive', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because public channel was archived`)
        await deactivateTeam(event.channel)
    })

    app.event('group_archive', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because private channel was archived`)
        await deactivateTeam(event.channel)
    })

    app.event('channel_left', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because bot was removed from channel.`)
        await deactivateTeam(event.channel)
    })

    app.event('group_left', async ({ event }) => {
        logger.info(`Deactivating team ${event.channel} because bot was removed from channel.`)
        await deactivateTeam(event.channel)
    })
}
