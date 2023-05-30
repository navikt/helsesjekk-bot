import { schedule } from 'node-cron'
import { getHours } from 'date-fns'

import { App } from '../app'
import logger from '../logger'
import { deactivateTeam, getActiveTeams, hasActiveAsk, hasActiveUnnaggedAsk, hasAskedToday } from '../db'
import { dayIndexToDay, getDayCorrect, getNowInNorway } from '../utils/date'
import { isLeader } from '../utils/leader'

import { postToTeam, remindTeam, revealTeam } from './message-poster'

// const EVERY_HOUR = '1 */1 * * *'
const EVERY_5TH_MINUTE = '*/5 * * * *'

export function configureMessageScheduler(app: App): void {
    /* We only support posting/revealing on every hour */
    schedule(EVERY_5TH_MINUTE, async () => {
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
                            `${team.name} want to post at ${team.postHour}:00 on ${dayIndexToDay(
                                team.postDay,
                            )}, reveal at ${team.revealHour}:00 on ${dayIndexToDay(team.revealDay)}`,
                    )
                    .join('\n')}`,
            )

            for (const team of activeTeams) {
                if (
                    isSameDayAndHour(team.postDay, team.postHour) &&
                    !(await hasActiveAsk(team.id)) &&
                    !(await hasAskedToday(team.id))
                ) {
                    logger.info(`It's time to post helsesjekk for team ${team.name}!`)

                    try {
                        await postToTeam(team, app.client)
                        continue
                    } catch (e) {
                        logger.error(new Error(`Failed to post helsesjekk for team ${team.name}.`, { cause: e }))
                        continue
                    }
                }

                if (isSameDayAndHour(team.revealDay, team.revealHour - 1) && (await hasActiveUnnaggedAsk(team.id))) {
                    logger.info(`Nagging team ${team.name} about helsesjekk closing in an hour!!`)

                    try {
                        await remindTeam(team, app.client)
                    } catch (e) {
                        if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                            logger.info(`The team ${team.name} has been archived, marking team as inactive`)
                            await deactivateTeam(team.id)
                            continue
                        }

                        logger.error(new Error(`Failed to remind team ${team.name} to post helsesjekk.`, { cause: e }))
                        continue
                    }
                }

                if (isSameDayAndHour(team.revealDay, team.revealHour) && (await hasActiveAsk(team.id))) {
                    logger.info(`It's time to reveal helsesjekk for team ${team.name}!`)

                    try {
                        await revealTeam(team, app.client)
                    } catch (e) {
                        if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                            logger.info(`The team ${team.name} has been archived, marking team as inactive`)
                            await deactivateTeam(team.id)
                            continue
                        }

                        logger.error(new Error(`Failed to reveal helsesjekk for team ${team.name}.`, { cause: e }))
                        continue
                    }
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

    return dayNow === day && hoursNow >= hour
}
