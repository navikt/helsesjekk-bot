import { Block, KnownBlock } from '@slack/types'
import { Answer, Asked, Team } from '@prisma/client'

import { dayIndexToDay, getWeekNumber } from '../utils/date'
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
            : textSection('Denne helsesjekken hadde ikke nok svar, så resultatet vil ikke bli delt.'),
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

export function createScoreBlocks(
    team: Team,
    asked: Asked & { answers: Answer[] },
    scoredQuestions: ScoredQuestion[],
    totalScore: number,
): (KnownBlock | Block)[] {
    return [
        plainHeader(`Helsesjekkresultat for team ${team.name} i uke ${getWeekNumber(asked.timestamp)}`),
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: scoredQuestions
                    .map(
                        (question) =>
                            `${scoreToEmoji(question.score)} *${question.question}*: ${question.score.toFixed(1)}`,
                    )
                    .join('\n'),
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `\n*Total score for ${team.name} i uke ${getWeekNumber(asked.timestamp)}*: ${scoreToEmoji(
                    totalScore,
                )} ${totalScore.toFixed(1)}`,
            },
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'plain_text',
                    text: `Det var ${asked.answers.length} svar på denne ukens helsesjekk.`,
                },
            ],
        },
    ]
}

export function createCountMetricsContext(responses: number, revealHour: number, revealDay: number) {
    return {
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text:
                    responses === 0
                        ? 'Ingen har svart enda. Det er på tide å svare!'
                        : `${responses} har svart på helsesjekken! Metrikkene vil bli delt kl. ${revealHour}:00 på ${dayIndexToDay(
                              revealDay,
                          )}.`,
            },
        ],
    }
}

function scoreToEmoji(score: number): string {
    if (score < 2.6) {
        return '🔴'
    } else if (score < 4) {
        return '🟡'
    } else {
        return '🟢'
    }
}
