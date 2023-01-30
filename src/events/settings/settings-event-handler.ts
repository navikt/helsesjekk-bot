import { App } from '../../app'
import { updateTeam } from '../../db'
import logger from '../../logger'

import { ModalStateTree, SettingsModalActions } from './settings-modal-builder'

export function configureSettingsEventsHandler(app: App): void {
    // Handles users submitting the helsesjekk settings modal
    app.view(SettingsModalActions.modalSubmit, async ({ ack, view }) => {
        logger.info(`User submitted settings modal`)

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

        await updateTeam(teamId, mappedValues)
        await ack()
    })
}
