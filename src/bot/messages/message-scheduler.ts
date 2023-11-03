import { schedule } from 'node-cron'
import { getHours } from 'date-fns'

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
import { botLogger } from '../bot-logger'
import { nextOccurrence } from '../../utils/frequency'

import { postToTeam, remindTeam, revealTeam } from './message-poster'

// const EVERY_HOUR = '1 */1 * * *'
const EVERY_5TH_MINUTE = '*/5 * * * *'

export function configureMessageScheduler(app: App): void {
    schedule(EVERY_5TH_MINUTE, () => cronJob(app))
}

async function cronJob(app: App): Promise<void> {
    const isPodLeader = await isLeader()
    if (!isPodLeader) {
        botLogger.info('Not the pod leader, skipping scheduled job')
        return
    }

    botLogger.info('Running scheduled job, checking for messages to post')

    try {
        await askRelevantTeams(app)
    } catch (e) {
        botLogger.error(new Error('Error occured during team ask', { cause: e }))
    }

    try {
        await revealRelevantTeams(app)
    } catch (e) {
        botLogger.error(new Error('Error occured during team reveal', { cause: e }))
    }

    try {
        await inspectForBrokenAsks()
    } catch (e) {
        botLogger.error(new Error('Scheduled job failed at dirty check', { cause: e }))
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

    botLogger.info(
        `Current time is ${getNowInNorway()}\nThere are ${activeTeams.length} active teams:\n${activeTeams
            .map(
                (team) =>
                    `${team.name} want to post at ${team.postHour}:00 on ${dayIndexToDay(team.postDay)}, reveal at ${
                        team.revealHour
                    }:00 on ${dayIndexToDay(team.revealDay)}`,
            )
            .join('\n')}\n\n${thisWeekTeams.length} of them want to post`,
    )

    for (const team of activeTeams) {
        // Should post new helsesjekk?
        if (
            isSameDayAndHour(team.postDay, team.postHour) &&
            !(await hasActiveAsk(team.id)) &&
            !(await hasAskedToday(team.id))
        ) {
            botLogger.info(`It's time to post helsesjekk for team ${team.name}!`)

            try {
                await postToTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    botLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                botLogger.error(new Error(`Failed to post helsesjekk for team ${team.name}.`, { cause: e }))
            }
        }
    }
}

async function revealRelevantTeams(app: App): Promise<void> {
    const revealTeams = await getTeamsToReveal()

    for (const team of revealTeams) {
        // Should nag about helsesjekk closing in an hour?
        if (isSameDayAndHour(team.revealDay, team.revealHour - 1) && (await hasActiveUnnaggedAsk(team.id))) {
            botLogger.info(`Nagging team ${team.name} about helsesjekk closing in an hour!!`)

            try {
                await remindTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    botLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                botLogger.error(new Error(`Failed to remind team ${team.name} to post helsesjekk.`, { cause: e }))
                continue
            }
        }

        // Should reveal helsesjekk?
        if (isSameDayAndHour(team.revealDay, team.revealHour) && (await hasActiveAsk(team.id))) {
            botLogger.info(`It's time to reveal helsesjekk for team ${team.name}!`)

            try {
                await revealTeam(team, app.client)
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    botLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                botLogger.error(new Error(`Failed to reveal helsesjekk for team ${team.name}.`, { cause: e }))
            }
        }
    }
}

async function inspectForBrokenAsks(): Promise<void> {
    const brokenAsks = await prisma.asked.findMany({
        where: { revealed: false, skipped: true },
    })
    if (brokenAsks.length > 0) {
        botLogger.error(`Found ${brokenAsks.length} asks: ${brokenAsks.map((it) => it.id).join(', ')}`)
    }
}

function isSameDayAndHour(day: number, hour: number): boolean {
    // Users are in Norway, so hackily convert to Norway time so hours will match the users settings
    const now = getNowInNorway()
    const dayNow = getDayCorrect(now)
    const hoursNow = getHours(now)

    return dayNow === day && hoursNow >= hour
}
