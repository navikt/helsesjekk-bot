import { App } from '../app'
import { createSettingsModal } from '../events/settings/settings-modal-builder'
import { postToTeam, remindTeam, revealTeam, updateResponseCount } from '../messages/message-poster'
import { createTeam, getPreviousAsk, getTeam, hasActiveUnnaggedAsk, prisma, updateTeamGroupAssociation } from '../../db'
import { scoreAsked } from '../../metrics/metrics'
import { createScoreBlocks } from '../messages/message-builder'

export function configureCommandsHandler(app: App): void {
    // Handles the /helsesjekk command, it opens the settings modal
    app.command(/(.*)/, async ({ command, ack, client, respond }) => {
        console.info(`User used /helsesjekk command`)

        if (command.text.trim().startsWith('assign')) {
            const groupId = command.text.replace('assign', '').trim()
            if (groupId.length === 0) {
                await ack()
                await respond({
                    text: 'Du må skrive inn en ad-gruppe etter kommandoen. :meow_sob:',
                })
                return
            }

            console.info(`User wants to connect ${command.channel_id} to ${groupId}`)
            await ack()
            await updateTeamGroupAssociation(command.channel_id, groupId)
            await respond({
                text: `Denne kanalen har blitt koblet til ad-gruppe "${groupId}"`,
            })
            return
        }

        const isBotInChannel = await isBotAddedToChannel(command.channel_id, client)
        if (isBotInChannel !== true) {
            console.warn(
                `Someone used /helsesjekk in a DM or a channel where it hasn't been added. Type: ${isBotInChannel} Channel ID: ${command.channel_id}`,
            )
            await ack()
            await respond({
                text: 'Ser ut som du prøver å ta i bruk helsesjekk i en kanal hvor jeg ikke er lagt til. :meow-shocked: Kan du legge meg til som en integrasjon først? :smile:',
            })
            return
        }

        await ack()
        const team = (await getTeam(command.channel_id)) ?? (await createTeam(command.channel_id, '[Ditt Team]'))
        await client.views.open({
            trigger_id: command.trigger_id,
            view: createSettingsModal(team),
        })
    })

    // TODO inn i settings slash command?
    app.event('app_mention', async ({ event, say }) => {
        console.info(`User mentioned the bot in ${process.env.NODE_ENV}`)

        try {
            if (process.env.NODE_ENV !== 'production') {
                // dev tool for forcing the bot to post questionnaire
                if (event.text.endsWith('post')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        await postToTeam(team, app.client)
                    }
                }

                // dev tool for forcing the bot to reveal the answers
                if (event.text.endsWith('lock')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        await revealTeam(team, app.client)
                    }
                }

                // dev tool for forcing the bot to reveal the answers
                if (event.text.endsWith('unlock')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        const toUpdate = await prisma().asked.findFirst({
                            where: { teamId: team.id },
                            orderBy: { timestamp: 'desc' },
                        })
                        if (!toUpdate) return

                        await prisma().asked.update({
                            data: { revealed: false },
                            where: { id: toUpdate.id },
                        })
                        console.info(`Unlocked ${team.name} (${team.id})`)
                        await updateResponseCount(team, app.client)
                    }
                }

                if (event.text.endsWith('remind')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        console.info(`Would team have been nagged? ${await hasActiveUnnaggedAsk(team.id)}`)
                        await remindTeam(team, app.client)
                    }
                }

                if (event.text.endsWith('debug')) {
                    const team = await getTeam(event.channel)
                    if (team == null) {
                        return
                    }

                    const ask = await prisma().asked.findFirst({
                        where: { teamId: team.id },
                        orderBy: { timestamp: 'desc' },
                        include: { answers: true },
                    })

                    if (ask == null) {
                        return
                    }

                    const previousAsked = await getPreviousAsk(ask)
                    const scoredAsk = scoreAsked(ask)
                    const previousScoredAsk = previousAsked ? scoreAsked(previousAsked) : null

                    await app.client.chat.postMessage({
                        channel: team.id,
                        text: `Svar på ukentlig helsesjekk for ${team.name}`,
                        blocks: createScoreBlocks(team, ask, scoredAsk, previousScoredAsk),
                        reply_broadcast: true,
                    })
                }
            }
        } catch (e) {
            console.error(e)
            await say('Oi! Noe gikk galt i botten. :( Dersom det skjer igjen, ta kontakt i #helsesjekk-bot.')
        }
    })
}

async function isBotAddedToChannel(
    channel: string,
    client: App['client'],
): Promise<true | 'not_in_private' | 'not_in_public' | 'unknown'> {
    try {
        const channelInfo = await client.conversations.info({
            channel: channel,
        })

        if (channelInfo.ok && channelInfo.channel && !channelInfo.channel.is_member) {
            return 'not_in_public'
        }

        if (!channelInfo.ok) {
            console.info(
                `Unable to get channel info, integration not in channel, or is a DM?: ${
                    channelInfo.error ?? 'No error'
                }`,
            )
            return 'not_in_private'
        }

        return true
    } catch (e) {
        console.error(new Error("Couldn't get channel info", { cause: e }))
        return 'unknown'
    }
}
