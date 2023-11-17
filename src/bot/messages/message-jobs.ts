import { getHours, getMinutes } from 'date-fns'

import { App } from '../app'
import {
    getActiveTeams,
    getBrokenAsks,
    getTeamsToReveal,
    deactivateTeam,
    hasActiveAsk,
    hasActiveUnnaggedAsk,
    hasAskedToday,
} from '../../db'
import { dayIndexToDay, getDayCorrect, getNowInNorway } from '../../utils/date'
import { nextOccurrence } from '../../utils/frequency'

import { postToTeam, remindTeam, revealTeam } from './message-poster'
import { cronLogger } from './message-scheduler'

export async function askRelevantTeams(app: App): Promise<number> {
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
                    `Post: ${dayIndexToDay(team.postDay)} ${team.postHour}:00,\t reveal: ${dayIndexToDay(
                        team.revealDay,
                    )} ${team.revealHour}:00\t (${team.frequency}+${team.weekSkew})\t ${team.name}`,
            )
            .join('\n')}\n\n${thisWeekTeams.length} of them want to post this week`,
    )

    let askedTeams = 0
    for (const team of thisWeekTeams) {
        // Should post new helsesjekk?
        if (
            isSameDayAndHour(team.postDay, team.postHour) &&
            !(await hasActiveAsk(team.id)) &&
            !(await hasAskedToday(team.id))
        ) {
            cronLogger.info(`It's time to post helsesjekk for team ${team.name}!`)

            try {
                await postToTeam(team, app.client)
                askedTeams++
            } catch (e) {
                if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                    cronLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                    await deactivateTeam(team.id)
                    continue
                }

                throw new Error(`Failed to post helsesjekk for team ${team.name}.`, { cause: e })
            }
        }
    }

    return askedTeams
}

export async function revealRelevantTeams(app: App): Promise<{ revealedTeams: number; naggedTeams: number }> {
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

    let revealedTeams = 0
    let naggedTeams = 0
    for (const team of revealTeams) {
        // Should nag about helsesjekk closing in an hour?
        if (isSameDayAndHour(team.revealDay, team.revealHour - 1) && (await hasActiveUnnaggedAsk(team.id))) {
            cronLogger.info(`Nagging team ${team.name} about helsesjekk closing in an hour!!`)

            try {
                await remindTeam(team, app.client)
                naggedTeams++
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
                revealedTeams++
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

    return {
        revealedTeams,
        naggedTeams,
    }
}

export async function inspectForBrokenAsks(): Promise<void> {
    const brokenAsks = await getBrokenAsks()
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
