import { App } from '../../app'
import { updateTeam } from '../../db'
import logger from '../../logger'
import { dayIndexToDay } from '../../utils/date'
import { updateResponseCount } from '../../messages/message-poster'

import { ModalStateTree, SettingsKeys as Keys } from './settings-modal-builder'

export function configureSettingsEventsHandler(app: App): void {
    // Handles users submitting the helsesjekk settings modal
    app.view(Keys.modalSubmit, async ({ ack, view, client, body }) => {
        logger.info(`User submitted settings modal`)

        const values: ModalStateTree = view.state.values as unknown as ModalStateTree
        const teamId = view.private_metadata

        const mappedValues = {
            name: values[Keys.teamName.block][Keys.teamName.action].value,
            active: values[Keys.active.block][Keys.active.action].selected_options.length > 0,
            postDay: day(values[Keys.postDay.block][Keys.postDay.action].selected_option.value, 4),
            postHour: hour(values[Keys.postHour.block][Keys.postHour.action].selected_time),
            revealDay: day(values[Keys.revealDay.block][Keys.revealDay.action].selected_option.value, 0),
            revealHour: hour(values[Keys.revealHour.block][Keys.revealHour.action].selected_time),
        }

        const team = await updateTeam(teamId, mappedValues)
        await ack()

        if (!team.active) {
            await client.chat.postEphemeral({
                user: body.user.id,
                channel: teamId,
                text: `Lagret innstillingene for ${team.name}! Jeg er nå deaktivert og vil ikke lenger poste helsesjekker.`,
            })
        } else {
            await client.chat.postEphemeral({
                user: body.user.id,
                channel: teamId,
                text: `Lagret innstillingene for ${team.name}!\n\nJeg vil legge ut helsesjekken på ${dayIndexToDay(
                    team.postDay,
                )} kl. ${team.postHour}:00 og vise metrikkene på ${dayIndexToDay(team.revealDay)} kl. ${
                    team.revealHour
                }:00`,
            })
        }

        await updateResponseCount(team, client)
    })
}

function hour(value: string): number {
    return +value.split(':')[0]
}

function day(value: string | undefined, fallback: number): number {
    return +(value ?? fallback)
}
