import { InputBlock, ModalView, Option, PlainTextOption } from '@slack/bolt'

import { Team } from '../../db'
import { plainHeader, textSection } from '../modal-utils'

export const SettingsModalActions = {
    modalSubmit: 'helsesjekk_settings_modal-submit',
}

// This is VERY loosely coupled with the blocks below. Be careful.
export interface ModalStateTree {
    'team_name-block': {
        'team_name-action': { value: string }
    }
    'post_day-block': {
        'post_day-action': { selected_option: Option }
    }
    'post_hour-block': {
        'post_hour-action': { selected_time: string }
    }
    'reveal_day-block': {
        'reveal_day-action': { selected_option: Option }
    }
    'reveal_hour-block': {
        'reveal_hour-action': { selected_time: string }
    }
    'active-block': {
        'active-action': { selected_options: Option[] }
    }
}

export function createSettingsModal(team: Team): ModalView {
    const dayOptions = createDayOptions()

    return {
        type: 'modal',
        callback_id: SettingsModalActions.modalSubmit,
        private_metadata: team.id,
        title: {
            type: 'plain_text',
            text: 'Helsesjekk',
        },
        blocks: [
            textSection(`Innstillinger for helsesjekk for team ${team.name}`),
            changeNameInput(team),
            activeCheckbox(team),
            plainHeader('Tidspunkt'),
            textSection(
                'Det er fint å sende helsesjekken på fredag, gjerne etter friday wins. Helsesjekken vil låses og vise statistikken, dette burde man ha klart før monday commits.',
            ),
            postDayInput(dayOptions, team),
            postHourInput(team),
            revealDayInput(dayOptions, team),
            revealHourInput(team),
        ],
        submit: {
            type: 'plain_text',
            text: 'Lagre',
        },
        close: {
            type: 'plain_text',
            text: 'Lukk',
        },
    }
}

function changeNameInput(team: Team): InputBlock {
    return {
        block_id: 'team_name-block',
        type: 'input',
        dispatch_action: false,
        element: {
            action_id: 'team_name-action',
            type: 'plain_text_input',
            initial_value: team.name,
        },
        label: {
            type: 'plain_text',
            text: 'Teamnavn',
            emoji: true,
        },
    }
}

function postDayInput(dayOptions: PlainTextOption[], team: Team) {
    return {
        block_id: 'post_day-block',
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Hvilken dag i uka skal helsesjekken sendes?',
        },
        element: {
            action_id: 'post_day-action',
            type: 'static_select',
            placeholder: {
                type: 'plain_text',
                text: 'Select an item',
                emoji: true,
            },
            options: dayOptions,
            initial_option: dayOptions[team.postDay],
        },
    }
}

function postHourInput(team: Team) {
    return {
        block_id: 'post_hour-block',
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Når skal helsesjekken sendes?',
        },
        element: {
            action_id: 'post_hour-action',
            type: 'timepicker',
            initial_time: `${team.postHour}:00`,
            placeholder: {
                type: 'plain_text',
                text: 'Velg tid',
            },
        },
    }
}

function revealDayInput(dayOptions: PlainTextOption[], team: Team) {
    return {
        block_id: 'reveal_day-block',
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Hvilken dag i uka skal helsesjekken være ferdig?',
        },
        element: {
            action_id: 'reveal_day-action',
            type: 'static_select',
            placeholder: {
                type: 'plain_text',
                text: 'Select an item',
                emoji: true,
            },
            initial_option: dayOptions[team.revealDay],
            options: dayOptions,
        },
    }
}

function revealHourInput(team: Team) {
    return {
        block_id: 'reveal_hour-block',
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Når skal helsesjekken være ferdig?',
        },
        element: {
            action_id: 'reveal_hour-action',
            type: 'timepicker',
            initial_time: `${team.revealHour}:00`,
            placeholder: { type: 'plain_text', text: 'Velg tid' },
        },
    }
}

function activeCheckbox(team: Team): InputBlock {
    const activeOption: PlainTextOption = {
        value: 'active',
        text: {
            type: 'plain_text',
            text: 'Aktiv',
        },
    }

    return {
        block_id: 'active-block',
        type: 'input',
        optional: true,
        element: {
            action_id: 'active-action',
            type: 'checkboxes',
            initial_options: team.active ? [activeOption] : undefined,
            options: [activeOption],
        },
        label: {
            type: 'plain_text',
            text: 'Skal helsesjekken være aktivert?',
        },
    }
}

function createDayOptions(): PlainTextOption[] {
    return ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((label, index) => {
        return {
            text: {
                type: 'plain_text',
                text: label,
            },
            value: index.toString(),
        }
    })
}
