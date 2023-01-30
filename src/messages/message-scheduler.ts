import { schedule } from 'node-cron'
import { getHours } from 'date-fns'

import { App } from '../app'
import logger from '../logger'
import { getActiveTeams, hasActiveAsk } from '../db'
import { getDayCorrect, getNowInNorway } from '../utils/date'
import { isLeader } from '../utils/leader'

import { postToTeam, revealTeam } from './message-poster'

const EVERY_HOUR = '1 */1 * * *'
// const EVERY_MINUTE = '*/1 * * * *'

export function configureMessageScheduler(app: App): void {
    /* We only support posting/revealing on every hour */
    schedule(EVERY_HOUR, async () => {
        const isPodLeader = await isLeader()
        if (!isPodLeader) {
            logger.info('Not the pod leader, skipping scheduled job')
            return
        }

        logger.info('Running scheduled job, checking for messages to post')

        try {
            const activeTeams = await getActiveTeams()
            logger.info(
                `There are ${activeTeams.length} active teams:\n${activeTeams
                    .map(
                        (team) =>
                            `${team.name} want to post at ${team.postHour} on ${team.postDay}, reveal at ${team.revealHour} on ${team.revealDay}`,
                    )
                    .join('\n')}`,
            )

            for (const team of activeTeams) {
                if (isSameDayAndHour(team.postDay, team.postHour) && !(await hasActiveAsk(team.id))) {
                    logger.info(`It's time to post helsesjekk for team ${team.name}!`)
                    await postToTeam(team, app.client)
                }

                if (isSameDayAndHour(team.revealDay, team.revealHour) && (await hasActiveAsk(team.id))) {
                    logger.info(`It's time to reveal helsesjekk for team ${team.name}!`)
                    await revealTeam(team, app.client)
                }
            }
        } catch (e) {
            logger.error(new Error('Scheduled job failed at root.', { cause: e }))
        }
    })
}

function isSameDayAndHour(day: number, hour: number): boolean {
    // Users are in Norway, so hackily convert to Norway time so hours will match the users settings
    const now = getNowInNorway()
    const dayNow = getDayCorrect(now)
    const hoursNow = getHours(now)

    return dayNow === day && hoursNow === hour
}
