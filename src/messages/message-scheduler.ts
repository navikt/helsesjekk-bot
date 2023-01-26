import { schedule } from 'node-cron'

import { App } from '../app'
import logger from '../logger'
import { getActiveTeams } from '../db/prisma'

import { postToTeam } from './message-poster'

const EVERY_HOUR = '0 */1 * * *'

export function configureMessageScheduler(app: App): void {
    /* We only support posting/revealing on every hour */
    schedule(EVERY_HOUR, async () => {
        logger.info('Running scheduled job, checking for mesasges to post')

        try {
            const activeTeams = await getActiveTeams()
            logger.info(`There are ${activeTeams.length} active teams`)

            for (const team of activeTeams) {
                // TODO check if time to post
                await postToTeam(team, app.client)
            }
        } catch (e) {
            logger.error(new Error('Scheduled job failed at root.', { cause: e }))
        }
    })
}
