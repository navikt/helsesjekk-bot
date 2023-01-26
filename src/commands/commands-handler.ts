import { App } from '../app'
import { createTeam, getTeam, reactivateTeam, teamStatus } from '../db/prisma'
import { createSettingsModal } from '../events/settings/settings-modal-builder'
import { postToTeam, revealTeam } from '../messages/message-poster'
import logger from '../logger'

export function configureCommandsHandler(app: App): void {
    // Handles the /helsesjekk command, it opens the settings modal
    app.command(/(.*)/, async ({ command, ack, client }) => {
        await ack()

        const team = (await getTeam(command.channel_id)) ?? (await createTeam(command.channel_id, command.channel_name))

        await client.views.open({
            trigger_id: command.trigger_id,
            view: createSettingsModal(team),
        })
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

                // dev tool for forcing the bot to reveal the answers
                if (event.text.endsWith('lock')) {
                    const team = await getTeam(event.channel)
                    if (team != null) {
                        await revealTeam(team, app.client)
                    }
                }
            }
        } catch (e) {
            logger.error(e)
            await say('Oi! Noe gikk galt i botten. :( Dersom det skjer igjen, ta kontakt i #helsesjekk-bot.')
        }
    })
}
