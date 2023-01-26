import { schedule } from 'node-cron'
import { Team } from '@prisma/client'
import { getDay, getHours } from 'date-fns'

import { App } from '../app'
import logger from '../logger'
import { getActiveTeams, hasActiveAsk } from '../db/prisma'

import { postToTeam } from './message-poster'

const EVERY_HOUR = '0 */1 * * *'
const EVERY_MINUTE = '*/1 * * * *'

export function configureMessageScheduler(app: App): void {
    /* We only support posting/revealing on every hour */
    schedule(EVERY_HOUR, async () => {
        logger.info('Running scheduled job, checking for mesasges to post')

        try {
            const activeTeams = await getActiveTeams()
            logger.info(`There are ${activeTeams.length} active teams`)

            for (const team of activeTeams) {
                if (shouldPost(team) && !(await hasActiveAsk(team.id))) {
                    await postToTeam(team, app.client)
                }
            }
        } catch (e) {
            logger.error(new Error('Scheduled job failed at root.', { cause: e }))
        }
    })
}

function shouldPost(team: Team): boolean {
    // Users are in Norway, so hackily convert to Norway time so hours will match the users settings
    const now = new Date(new Date().toLocaleString('en', { timeZone: 'Europe/Oslo' }))
    const day = (getDay(now) + 6) % 7
    const hours = getHours(now)

    logger.info(
        `Checking if team ${team.name} should post, they want to post at ${team.postHour} on ${team.postDay}, it is now ${hours} on ${day}`,
    )

    return day === team.postDay && hours === team.postHour
}
