import { App } from '../app'
import logger from '../logger'
import { createTeam, deactivateTeam, getTeam, reactivateTeam, teamStatus, updateTeam } from '../db/prisma'
import { postToTeam } from '../messages/message-poster'

import { createSettingsModal, ModalStateTree } from './modal-builder'

export function configureEventsHandler(app: App): void {
    // Handles the /helsesjekk command, it opens the settings modal
    app.command(/(.*)/, async ({ command, ack, client }) => {
        await ack()

        const team = (await getTeam(command.channel_id)) ?? (await createTeam(command.channel_id, command.channel_name))

        await client.views.open({
            trigger_id: command.trigger_id,
            view: createSettingsModal(team),
        })
    })

    // Handles users submitting the helsesjekk settings modal
    app.view('helsesjekk_settings_modal', async ({ ack, view }) => {
        const values: ModalStateTree = view.state.values as unknown as ModalStateTree
        const teamId = view.private_metadata

        const mappedValues = {
            name: values['team_name-block']['team_name-action'].value,
            active: values['active-block']['active-action'].selected_options.length > 0,
            postDay: +(values['post_day-block']['post_day-action'].selected_option.value ?? 4),
            postHour: +values['post_hour-block']['post_hour-action'].selected_time.split(':')[0],
            revealDay: +(values['reveal_day-block']['reveal_day-action'].selected_option.value ?? 0),
            revealHour: +values['reveal_hour-block']['reveal_hour-action'].selected_time.split(':')[0],
        }
        console.log(mappedValues)

        await updateTeam(teamId, mappedValues)
        await ack()
    })

    // TODO inn i settings slash command?
    app.event('app_mention', async ({ event, say, client }) => {
        try {
            const channelInfo = await client.conversations.info({ channel: event.channel })
            const channelName = channelInfo.channel?.name ?? 'Ukjent! :('

            if (event.text.endsWith('start')) {
                const status = await teamStatus(event.channel)
                if (status === 'ACTIVE') {
                    await say('Botten er allerede klar til bruk. :thumbsup:')
                } else if (status === 'NEW') {
                    await createTeam(event.channel, channelName)
                    await say(`Helsesjekk er klar til bruk for ${channelName}! :thumbsup:`)
                } else {
                    await reactivateTeam(event.channel)
                    await say('Helsesjekk er reaktivert for teamet ditt! :thumbsup:')
                }
            }

            if (process.env.NODE_ENV !== 'production') {
                // dev tool for forcing the bot to post questionnaire
                if (event.text.endsWith('post')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        await postToTeam(team, app.client)
                    }
                }

                if (event.text.endsWith('lock')) {
                    // TODO debug lock and reveal post
                }
            }
        } catch (e) {
            logger.error(e)
            await say('Oi! Noe gikk galt i botten. :( Dersom det skjer igjen, ta kontakt i #helsesjekk-bot.')
        }
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
