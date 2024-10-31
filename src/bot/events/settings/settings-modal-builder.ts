import { InputBlock, ModalView, Option, PlainTextOption, SectionBlock } from '@slack/bolt'
import { Block, KnownBlock } from '@slack/types'

import { Team } from '../../../db'
import { addIf, plainHeader, textSection } from '../modal-utils'
import { questionsFromJsonb } from '../../../questions/jsonb-utils'
import { text } from '../../../utils/bolt-utils'
import { QuestionType } from '../../../safe-types'
import { dayIndexToDay } from '../../../utils/date'
import { nextOccurenceText, nextOccurrence } from '../../../utils/frequency'

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
    addQuestion: {
        block: 'add_question-block',
        action: 'add_question-action',
    },
    skipAddQuestion: {
        block: 'skip_question-block',
        action: 'skip_question-action',
    },
    newQuestion: {
        blocks: {
            question: 'new_question-block',
            answerHigh: 'new_question-answer_high-block',
            answerMid: 'new_question-answer_mid-block',
            answerLow: 'new_question-answer_low-block',
            category: 'new_question-category-block',
        },
        actions: {
            question: 'new_question-action',
            answerHigh: 'new_question-answer_high-action',
            answerMid: 'new_question-answer_mid-action',
            answerLow: 'new_question-answer_low-action',
            category: 'new_question-category-action',
        },
    },
    deleteQuestion: {
        action: 'delete_question-action',
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
    [SettingsKeys.newQuestion.blocks.question]: {
        [SettingsKeys.newQuestion.actions.question]: { value: string }
    }
    [SettingsKeys.newQuestion.blocks.answerHigh]: {
        [SettingsKeys.newQuestion.actions.answerHigh]: { value: string }
    }
    [SettingsKeys.newQuestion.blocks.answerMid]: {
        [SettingsKeys.newQuestion.actions.answerMid]: { value: string }
    }
    [SettingsKeys.newQuestion.blocks.answerLow]: {
        [SettingsKeys.newQuestion.actions.answerLow]: { value: string }
    }
    [SettingsKeys.newQuestion.blocks.category]: {
        [SettingsKeys.newQuestion.actions.category]: { selected_option: Option }
    }
}

export function createSettingsModal(team: Team, isAdding = false): ModalView {
    const dayOptions = createDayOptions()
    const { postDate } = nextOccurrence({
        team,
        frequency: team.frequency,
        weekSkew: team.weekSkew,
    })

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
            textSection(
                'For å endre på frekvensen på helsesjekken og andre innstillinger, besøk https://helsesjekk-bot.nav.no/',
            ),
            plainHeader('Frekvens'),
            textSection(team.frequency === 1 ? 'Hver uke' : `Hver ${team.frequency}. uke`),
            textSection(
                `Dersom botten er aktiv, er neste helsesjekk ${dayIndexToDay(team.postDay)} kl. ${
                    team.postHour
                }:00 ${nextOccurenceText(postDate)}`,
            ),
            postDayInput(dayOptions, team),
            postHourInput(team),
            revealDayInput(dayOptions, team),
            revealHourInput(team),
            ...customQuestionsSection(team, isAdding),
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

function postDayInput(dayOptions: PlainTextOption[], team: Team): KnownBlock {
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

function postHourInput(team: Team): KnownBlock {
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

function revealDayInput(dayOptions: PlainTextOption[], team: Team): KnownBlock {
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

function revealHourInput(team: Team): KnownBlock {
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

function customQuestionsSection(team: Team, isAdding: boolean): (KnownBlock | Block)[] {
    const customQuestions = questionsFromJsonb(team.questions).filter((it) => it.custom)

    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: 'Egendefinerte spørsmål',
                emoji: true,
            },
        },
        ...addIf(customQuestions.length > 0, () =>
            customQuestions.map(
                (it) =>
                    ({
                        block_id: it.questionId,
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*${it.question}*\n🟢 ${it.answers.HIGH}\n🟡 ${it.answers.MID}\n🔴 ${it.answers.LOW}`,
                        },
                        accessory: {
                            type: 'button',
                            text: text('Slett spørsmål'),
                            confirm: {
                                text: text(`Er du sikker på at du vil slette spørsmålet "${it.question}"`),
                            },
                            style: 'danger',
                            action_id: SettingsKeys.deleteQuestion.action,
                        },
                    }) satisfies SectionBlock,
            ),
        ),
        ...addIf(customQuestions.length === 0 && !isAdding, () => ({
            type: 'context',
            elements: [text('Ingen egendefinerte spørsmål')],
        })),
        ...addIf(isAdding, () => [
            {
                block_id: SettingsKeys.newQuestion.blocks.question,
                type: 'input',
                element: {
                    type: 'plain_text_input',
                    action_id: SettingsKeys.newQuestion.actions.question,
                    placeholder: text('F.eks: Kodekvalitet'),
                },
                label: text('Spørsmål'),
            },
            {
                block_id: SettingsKeys.newQuestion.blocks.answerHigh,
                type: 'input',
                element: {
                    type: 'plain_text_input',
                    action_id: SettingsKeys.newQuestion.actions.answerHigh,
                    placeholder: text('Jeg synes at...'),
                },
                label: text('🟢 Bra svar'),
            },
            {
                block_id: SettingsKeys.newQuestion.blocks.answerMid,
                type: 'input',
                element: {
                    type: 'plain_text_input',
                    action_id: SettingsKeys.newQuestion.actions.answerMid,
                    placeholder: text('Vi er et...'),
                },

                label: text('🟡 Medium svar'),
            },
            {
                block_id: SettingsKeys.newQuestion.blocks.answerLow,
                type: 'input',
                element: {
                    type: 'plain_text_input',
                    action_id: SettingsKeys.newQuestion.actions.answerLow,
                    placeholder: text('Ting er...'),
                },
                label: text('🔴 Dårlig svar :('),
            },
            {
                type: 'input',
                label: text('Spørsmålskategori (brukes til statistikk)'),
                block_id: SettingsKeys.newQuestion.blocks.category,
                element: {
                    type: 'static_select',
                    placeholder: text('Velg kategori'),
                    options: Object.values(QuestionType).map((it) => ({
                        text: text(it),
                        value: it,
                    })),
                    initial_option: {
                        text: text(QuestionType.SPEED),
                        value: QuestionType.SPEED,
                    },
                    action_id: SettingsKeys.newQuestion.actions.category,
                },
            } satisfies InputBlock,
            {
                type: 'actions',
                block_id: SettingsKeys.skipAddQuestion.block,
                elements: [
                    {
                        type: 'button',
                        text: text('Avbryt nytt spørsmål'),
                        value: 'regret-add-question',
                        action_id: SettingsKeys.skipAddQuestion.action,
                    },
                ],
            },
        ]),
        ...addIf(!isAdding, () => ({
            type: 'actions',
            block_id: SettingsKeys.addQuestion.block,
            elements: [
                {
                    type: 'button',
                    text: text('Legg til spørsmål'),
                    value: 'add-question',
                    action_id: SettingsKeys.addQuestion.action,
                },
            ],
        })),
    ]
}

function createDayOptions(): PlainTextOption[] {
    return ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((label, index) => {
        return {
            text: text(label),
            value: index.toString(),
        }
    })
}
