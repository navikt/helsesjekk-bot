import { App } from '../../app'
import { updateTeam } from '../../db'
import logger from '../../logger'

import { ModalStateTree, SettingsKeys as Keys } from './settings-modal-builder'

export function configureSettingsEventsHandler(app: App): void {
    // Handles users submitting the helsesjekk settings modal
    app.view(Keys.modalSubmit, async ({ ack, view }) => {
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

        await updateTeam(teamId, mappedValues)
        await ack()
    })
}

function hour(value: string): number {
    return +value.split(':')[0]
}

function day(value: string | undefined, fallback: number): number {
    return +(value ?? fallback)
}
