import { schedule } from 'node-cron'
import { getHours, getMinutes } from 'date-fns'
import { logger } from '@navikt/next-logger'

import { App } from '../app'
import {
    deactivateTeam,
    getActiveTeams,
    getTeamsToReveal,
    hasActiveAsk,
    hasActiveUnnaggedAsk,
    hasAskedToday,
    prisma,
} from '../../db'
import { dayIndexToDay, getDayCorrect, getNowInNorway } from '../../utils/date'
import { isLeader } from '../../utils/leader'
import { nextOccurrence } from '../../utils/frequency'

import { postToTeam, remindTeam, revealTeam } from './message-poster'

export const cronLogger = logger.child({ x_context: 'cron-job' })

export function configureMessageScheduler(app: App): void {
    const EVERY_5TH_MINUTE = '*/5 * * * *'

    schedule(EVERY_5TH_MINUTE, () => cronJob(app))
}

async function cronJob(app: App): Promise<void> {
    const isPodLeader = await isLeader()
    if (!isPodLeader) {
        cronLogger.info('Not the pod leader, skipping scheduled job')
        return
    }

    cronLogger.info('Running scheduled job, checking for messages to post')

    try {
        await askRelevantTeams(app)
    } catch (e) {
        cronLogger.error(new Error('Error occured during team ask', { cause: e }))
    }

    try {
        await revealRelevantTeams(app)
    } catch (e) {
        cronLogger.error(new Error('Error occured during team reveal', { cause: e }))
    }

    try {
        await inspectForBrokenAsks()
    } catch (e) {
        cronLogger.error(new Error('Scheduled job failed at dirty check', { cause: e }))
    }
}

async function askRelevantTeams(app: App): Promise<void> {
    const activeTeams = await getActiveTeams()
    const thisWeekTeams = activeTeams.filter((team) => {
        const { isThisWeekRelevant } = nextOccurrence({
            team: team,
            frequency: team.frequency,
            weekSkew: team.weekSkew,
        })

        return isThisWeekRelevant
    })

    const nowInNorway = getNowInNorway()
    const dayNow = getDayCorrect(nowInNorway)
    const hoursNow = getHours(nowInNorway)
    const minutesNow = getMinutes(nowInNorway)

    cronLogger.info(
        `Ask: Current time is ${dayNow} ${hoursNow}:${minutesNow}\n\nThere are ${
            activeTeams.length
        } active teams:\n${activeTeams
            .map(
                (team) =>
                    `${team.name} want to post at ${team.postHour}:00 on ${dayIndexToDay(team.postDay)}, reveal at ${
                        team.revealHour
                    }:00 on ${dayIndexToDay(team.revealDay)}`,
            )
            .join('\n')}\n\n${thisWeekTeams.length} of them want to post this week`,
    )

    for (const team of activeTeams) {
        // Should post new helsesjekk?
        if (
            isSameDayAndHour(team.postDay, team.postHour) &&
            !(await hasActiveAsk(team.id)) &&
            !(await hasAskedToday(team.id))
        ) {
            cronLogger.info(`It's time to post helsesjekk for team ${team.name}!`)

            try {
                await postToTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    cronLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                cronLogger.error(new Error(`Failed to post helsesjekk for team ${team.name}.`, { cause: e }))
            }
        }
    }
}

async function revealRelevantTeams(app: App): Promise<void> {
    const revealTeams = await getTeamsToReveal()

    const nowInNorway = getNowInNorway()
    const dayNow = getDayCorrect(nowInNorway)
    const hoursNow = getHours(nowInNorway)
    const minutesNow = getMinutes(nowInNorway)

    if (revealTeams.length === 0) {
        cronLogger.info(
            `Reveal: Current time is ${dayNow} ${hoursNow}:${minutesNow}\n\nThere are no teams to reveal this week based on active asks.`,
        )
    } else {
        cronLogger.info(
            `Reveal: Current time is ${dayNow} ${hoursNow}:${minutesNow}\n\nThere are ${
                revealTeams.length
            } teams that need reveal this week:\n${revealTeams
                .map(
                    (team) =>
                        `${team.name} want to reveal at ${team.revealHour}:00 on ${dayIndexToDay(team.revealDay)}`,
                )
                .join('\n')}`,
        )
    }

    for (const team of revealTeams) {
        // Should nag about helsesjekk closing in an hour?
        if (isSameDayAndHour(team.revealDay, team.revealHour - 1) && (await hasActiveUnnaggedAsk(team.id))) {
            cronLogger.info(`Nagging team ${team.name} about helsesjekk closing in an hour!!`)

            try {
                await remindTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    cronLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                cronLogger.error(new Error(`Failed to remind team ${team.name} to post helsesjekk.`, { cause: e }))
                continue
            }
        }

        // Should reveal helsesjekk?
        if (isSameDayAndHour(team.revealDay, team.revealHour) && (await hasActiveAsk(team.id))) {
            cronLogger.info(`It's time to reveal helsesjekk for team ${team.name}!`)

            try {
                await revealTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    cronLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                cronLogger.error(new Error(`Failed to reveal helsesjekk for team ${team.name}.`, { cause: e }))
            }
        }
    }
}

async function inspectForBrokenAsks(): Promise<void> {
    const brokenAsks = await prisma.asked.findMany({
        where: { revealed: false, skipped: true },
    })
    if (brokenAsks.length > 0) {
        cronLogger.error(`Found ${brokenAsks.length} asks: ${brokenAsks.map((it) => it.id).join(', ')}`)
    }
}

function isSameDayAndHour(day: number, hour: number): boolean {
    // Users are in Norway, so hackily convert to Norway time so hours will match the users settings
    const now = getNowInNorway()
    const dayNow = getDayCorrect(now)
    const hoursNow = getHours(now)

    return dayNow === day && hoursNow >= hour
}
