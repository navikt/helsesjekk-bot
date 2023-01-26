import { Block, KnownBlock } from '@slack/types'

import { getWeekNumberNow } from '../utils/date'

export const MessageActions = {
    FillButtonClicked: 'open_health_check_modal-action',
}

/**
 * Blocks for the initial question. It contains a button that allows users to open
 * up a modal to answer the quiz.
 */
export function createRootPostBlocks(teamName: string): (KnownBlock | Block)[] {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:health: Det er på tide med helsesjekk uke ${getWeekNumberNow()} for ${teamName}! :wave:`,
                emoji: true,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: 'Alle på dette teamet inviteres til å svare på noen raske spørsmål for å dele hvordan de føler tilstanden på teaamet er. Svarene gis på trafikklys-format. ?\n\n🟢 Bra! \n🟡 Middels \n🔴 Dårlig ',
            },
        },
        {
            type: 'actions',
            elements: [
                {
                    action_id: MessageActions.FillButtonClicked,
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Svar på helsesjekk',
                    },
                    style: 'primary',
                    value: 'click_me_123',
                },
            ],
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: 'Hva du svarer deles ikke med noen. Det brukes kun til å lage helsemetrikker for teamet.',
                },
            ],
        },
    ]
}

export function createCountMetricsContext(responses: number) {
    return {
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text:
                    responses === 0
                        ? 'Ingen har svart enda. Det er på tide å svare!'
                        : `${responses} har svart på helsesjekken!`,
            },
        ],
    }
}
