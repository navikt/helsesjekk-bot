import { schedule } from 'node-cron'
import { getHours } from 'date-fns'

import { App } from '../app'
import { deactivateTeam, getActiveTeams, hasActiveAsk, hasActiveUnnaggedAsk, hasAskedToday, prisma } from '../../db'
import { dayIndexToDay, getDayCorrect, getNowInNorway, getWeekNumber } from '../../utils/date'
import { isLeader } from '../../utils/leader'
import { botLogger } from '../bot-logger'

import { postToTeam, remindTeam, revealTeam } from './message-poster'

// const EVERY_HOUR = '1 */1 * * *'
const EVERY_5TH_MINUTE = '*/5 * * * *'

export function configureMessageScheduler(app: App): void {
    /* We only support posting/revealing on every hour */
    schedule(EVERY_5TH_MINUTE, async () => {
        const isPodLeader = await isLeader()
        if (!isPodLeader) {
            botLogger.info('Not the pod leader, skipping scheduled job')
            return
        }

        botLogger.info('Running scheduled job, checking for messages to post')

        try {
            const activeTeams = await getActiveTeams()
            botLogger.info(
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
                    botLogger.info(`It's time to post helsesjekk for team ${team.name}!`)

                    try {
                        await postToTeam(team, app.client)
                        continue
                    } catch (e) {
                        if (e instanceof Error && e.message.includes('An API error occurred: is_archived')) {
                            botLogger.info(`The team ${team.name} has been archived, marking team as inactive`)
                            await deactivateTeam(team.id)
                            continue
                        }

                        botLogger.error(new Error(`Failed to post helsesjekk for team ${team.name}.`, { cause: e }))
                        continue
                    }
                }

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

                        botLogger.error(
                            new Error(`Failed to remind team ${team.name} to post helsesjekk.`, { cause: e }),
                        )
                        continue
                    }
                }

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
                        continue
                    }
                }
            }
        } catch (e) {
            botLogger.error(new Error('Scheduled job failed at root.', { cause: e }))
        }

        // Temporary code to resolve some broken asks
        const brokenAsks = await prisma.asked.findMany({
            where: { revealed: false, skipped: true },
        })

        if (brokenAsks.length > 0) {
            botLogger.warn(`Found ${brokenAsks.length} broken asks, resolving these`)

            for (const asked of brokenAsks) {
                botLogger.warn(
                    `Resolving broken ask for team ${asked.teamId}, ask id ${
                        asked.id
                    }, timestamp: ${asked.timestamp.toISOString()}`,
                )

                await prisma.asked.update({
                    data: {
                        revealed: true,
                        skipped: true,
                    },
                    where: {
                        id: asked.id,
                    },
                })

                await app.client.chat.postMessage({
                    channel: asked.teamId,
                    thread_ts: asked.messageTs,
                    text: `Denne helsesjekken ble hoppet over grunnet krøll i Helsesjekk-botten. Vi beklager!\n\n Håper dere fortsetter å bruke botten neste uke som vanlig. :)`,
                })
                await app.client.chat.update({
                    channel: asked.teamId,
                    ts: asked.messageTs,
                    text: `Helsesjekk lukket på grunn av krøll med Helsesjekk-botten.`,
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: `:warning: Helsesjekk for uke ${getWeekNumber(
                                    asked.timestamp,
                                )} ble automatisk lukket på grunn av krøll med Helsesjekk-botten. :warning:`,
                                emoji: true,
                            },
                        },
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: 'Problemet skal være løst, og vil fungere som vanlig neste spørring. Ta kontakt på #helsesjekk-bot dersom det skulle være noe.',
                            },
                        },
                    ],
                })
            }
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
