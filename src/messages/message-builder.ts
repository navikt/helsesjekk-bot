import { Block, KnownBlock } from '@slack/types'
import { Asked, Team } from '@prisma/client'

import { getWeekNumber } from '../utils/date'
import { ScoredQuestion } from '../metrics/metrics'
import { plainHeader, textSection } from '../events/modal-utils'

export const MessageActions = {
    FillButtonClicked: 'open_health_check_modal-action',
}

/**
 * Blocks for the initial question. It contains a button that allows users to open
 * up a modal to answer the quiz.
 */
export function createRootPostBlocks(teamName: string, dateForWeek: Date, invalid = false): (KnownBlock | Block)[] {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                // TODO: Bug: denne vil oppdatere ukesnummeret når noen svarer på søndag
                text: `:health: Det er på tide med helsesjekk uke ${getWeekNumber(
                    dateForWeek,
                )} for ${teamName}! :wave:`,
                emoji: true,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: 'Alle på dette teamet inviteres til å svare på noen raske spørsmål for å dele hvordan de føler tilstanden på teaamet er. Svarene gis på trafikklys-format.\n\n🟢 Bra! \n🟡 Middels \n🔴 Dårlig ',
            },
        },

        !invalid
            ? {
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
              }
            : textSection('Denne helsesjekken ikke nok svar, så resultatet ble aldri vist.'),
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

export function createCompletedBlocks(responses: number, dateForWeek: Date): (KnownBlock | Block)[] {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:health: Takk for at du svarte på helsesjekken for uke ${getWeekNumber(
                    dateForWeek,
                )}! Denne er nå stengt. :lock:`,
                emoji: true,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Det var ${responses} svar på denne ukens helsesjekk.`,
            },
        },
    ]
}

export function createScoreBlocks(team: Team, asked: Asked, scoredQuestions: ScoredQuestion[]): (KnownBlock | Block)[] {
    return [
        plainHeader(`Helsesjekk for uke ${getWeekNumber(asked.timestamp)}`),
        textSection(`Team: ${team.name}`),
        ...scoredQuestions.map((scoredQuestion) => {
            return textSection(`*${scoredQuestion.question}* \n${scoredQuestion.score}`)
        }),
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
