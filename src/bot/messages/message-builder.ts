import { Block, KnownBlock } from '@slack/types'
import { Answer, Asked, Team } from '@prisma/client'
import * as R from 'remeda'

import { dayIndexToDay, getWeekNumber } from '../../utils/date'
import { ScoredAsk, ScoredQuestion } from '../../metrics/metrics'
import { plainHeader, textSection } from '../events/modal-utils'
import { questionTypeToText } from '../../utils/asked'
import { scoreToEmoji } from '../../utils/score'
import { QuestionType } from '../../safe-types'

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
                text: 'Alle på dette teamet inviteres til å svare på noen raske spørsmål for å dele hvordan de føler tilstanden på teamet er. Svarene gis på trafikklys-format.\n\n🟢 Bra! \n🟡 Middels \n🔴 Dårlig ',
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
    scoredAsk: ScoredAsk,
    previousScoredAsk: ScoredAsk | null,
): (KnownBlock | Block)[] {
    const hasOptionalLegend = scoredAsk.scoredQuestions.some((it) => it.optional)
        ? '\n _* = antall svar på valgfritt spørsmål_'
        : ''

    return [
        plainHeader(`Helsesjekkresultat for team ${team.name} i uke ${getWeekNumber(asked.timestamp)}`),
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: createScoreMrkdwn(scoredAsk, previousScoredAsk),
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `\n*Total score for ${team.name} i uke ${getWeekNumber(asked.timestamp)}*: ${scoreToEmoji(
                    scoredAsk.totalScore,
                )} ${scoredAsk.totalScore.toFixed(1)} ${addDiff(
                    scoredAsk.totalScore,
                    previousScoredAsk?.totalScore ?? null,
                )}${hasOptionalLegend}`,
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

export function createCountMetricsContext(responses: number, revealHour: number, revealDay: number): KnownBlock {
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

function createScoreMrkdwn(scoredAsk: ScoredAsk, previousScoredAsk: ScoredAsk | null): string {
    const grouped = R.pipe(scoredAsk.scoredQuestions, R.groupBy(R.prop('type')), R.entries())

    const createScoreLine = (question: ScoredQuestion): string => {
        const optionalQuestionMarker = question.optional ? ` _(${question.answerCount}\*)_` : ''
        if (question.score === 0) {
            return `:warning: *${question.question}*${optionalQuestionMarker}: _Ikke nok svar_`
        }

        return `${scoreToEmoji(question.score)} *${question.question}*${optionalQuestionMarker}: ${question.score.toFixed(1)} ${addQuestionDiff(
            question,
            previousScoredAsk,
        )}`
    }

    return `${grouped
        .map(
            ([type, questions]) =>
                `*${questionTypeToText(type as QuestionType)}*:\n${questions.map(createScoreLine).join('\n')}`,
        )
        .join('\n')}`
}

function addQuestionDiff(question: ScoredQuestion, previousScoredAsk: ScoredAsk | null): string {
    if (previousScoredAsk == null) return ''

    const previousQuestion = previousScoredAsk.scoredQuestions.find((it) => it.id === question.id)

    if (previousQuestion == null || previousQuestion.score === 0) return ''

    return addDiff(question.score, previousQuestion.score)
}

function addDiff(scoreLeft: number, scoreRight: number | null): string {
    if (scoreRight == null) return ''

    const diff = scoreLeft - scoreRight

    return `(${diff > 0 ? '+' : ''}${diff.toFixed(1)})`
}
