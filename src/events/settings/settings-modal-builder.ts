import { InputBlock, ModalView, Option, PlainTextOption } from '@slack/bolt'

import { Team } from '../../db'
import { plainHeader, textSection } from '../modal-utils'

export const SettingsKeys = {
    modalSubmit: 'helsesjekk_settings_modal-submit',
    teamName: {
        block: 'team_name-block',
        action: 'team_name-action',
    },
    postDay: {
        block: 'post_day-block',
        action: 'post_day-action',
    },
    postHour: {
        block: 'post_hour-block',
        action: 'post_hour-action',
    },
    revealDay: {
        block: 'reveal_day-block',
        action: 'reveal_day-action',
    },
    revealHour: {
        block: 'reveal_hour-block',
        action: 'reveal_hour-action',
    },
    active: {
        block: 'active-block',
        action: 'active-action',
    },
} as const

// This is VERY loosely coupled with the blocks below. Be careful.
export interface ModalStateTree {
    [SettingsKeys.teamName.block]: {
        [SettingsKeys.teamName.action]: { value: string }
    }
    [SettingsKeys.postDay.block]: {
        [SettingsKeys.postDay.action]: { selected_option: Option }
    }
    [SettingsKeys.postHour.block]: {
        [SettingsKeys.postHour.action]: { selected_time: string }
    }
    [SettingsKeys.revealDay.block]: {
        [SettingsKeys.revealDay.action]: { selected_option: Option }
    }
    [SettingsKeys.revealHour.block]: {
        [SettingsKeys.revealHour.action]: { selected_time: string }
    }
    [SettingsKeys.active.block]: {
        [SettingsKeys.active.action]: { selected_options: Option[] }
    }
}

export function createSettingsModal(team: Team): ModalView {
    const dayOptions = createDayOptions()

    return {
        type: 'modal',
        callback_id: SettingsKeys.modalSubmit,
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
        block_id: SettingsKeys.teamName.block,
        type: 'input',
        dispatch_action: false,
        element: {
            action_id: SettingsKeys.teamName.action,
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
        block_id: SettingsKeys.postDay.block,
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Hvilken dag i uka skal helsesjekken sendes?',
        },
        element: {
            action_id: SettingsKeys.postDay.action,
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
        block_id: SettingsKeys.postHour.block,
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Når skal helsesjekken sendes?',
        },
        element: {
            action_id: SettingsKeys.postHour.action,
            type: 'timepicker',
            initial_time: `${team.postHour.toString().padStart(2, '0')}:00`,
            placeholder: {
                type: 'plain_text',
                text: 'Velg tid',
            },
        },
    }
}

function revealDayInput(dayOptions: PlainTextOption[], team: Team) {
    return {
        block_id: SettingsKeys.revealDay.block,
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Hvilken dag i uka skal helsesjekken være ferdig?',
        },
        element: {
            action_id: SettingsKeys.revealDay.action,
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
        block_id: SettingsKeys.revealHour.block,
        type: 'input',
        label: {
            type: 'plain_text',
            text: 'Når skal helsesjekken være ferdig?',
        },
        element: {
            action_id: SettingsKeys.revealHour.action,
            type: 'timepicker',
            initial_time: `${team.revealHour.toString().padStart(2, '0')}:00`,
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
        block_id: SettingsKeys.active.block,
        type: 'input',
        optional: true,
        element: {
            action_id: SettingsKeys.active.action,
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
