import { Block, KnownBlock } from '@slack/types'
import { InputBlock, ModalView, Option } from '@slack/bolt'
import { groupBy } from 'remeda'

import { AnswerLevel, Team, Asked, QuestionAnswer } from '../../../db'
import { questionsFromJsonb } from '../../../questions/jsonb-utils'
import { addIf, addIfArray, plainHeader, textSection } from '../modal-utils'
import { questionTypeToText } from '../../../utils/asked'
import { Question, QuestionType } from '../../../safe-types'

export const HealthcheckModalActions = {
    modalSubmit: 'helsesjekk_form_modal-submit',
}

export function createHealthCheckModal(
    team: Team,
    asked: Asked,
    userId: string,
    existingAnswers: QuestionAnswer[] | null,
): ModalView {
    return {
        type: 'modal',
        callback_id: HealthcheckModalActions.modalSubmit,
        title: {
            type: 'plain_text',
            text: `Svar på helsesjekk`,
            emoji: true,
        },
        submit: {
            type: 'plain_text',
            text: 'Send inn',
            emoji: true,
        },
        close: {
            type: 'plain_text',
            text: 'Avbryt',
            emoji: true,
        },
        private_metadata: team.id,
        blocks: createHealthCheckModalBlocks(questionsFromJsonb(asked.questions), existingAnswers),
    }
}

export function createHealthCheckModalBlocks(
    questions: Question[],
    existingAnswers: QuestionAnswer[] | null,
): (KnownBlock | Block)[] {
    const grouped = groupBy(questions, (q) => q.type)
    const allQuestionBlocks = [
        ...addIfArray(grouped.TEAM_HEALTH, (teamHealth) => [
            plainHeader(questionTypeToText(QuestionType.TEAM_HEALTH)),
            ...teamHealth.map((question) => createSelectSectionBlock(question, existingAnswers)),
        ]),
        ...addIfArray(grouped.SPEED, (speed) => [
            plainHeader(questionTypeToText(QuestionType.SPEED)),
            ...speed.map((question) => createSelectSectionBlock(question, existingAnswers)),
        ]),
        ...addIfArray(grouped.TECH, (tech) => [
            plainHeader(questionTypeToText(QuestionType.TECH)),
            ...tech.map((question) => createSelectSectionBlock(question, existingAnswers)),
        ]),
        ...addIfArray(grouped.OTHER, (other) => [
            plainHeader(questionTypeToText(QuestionType.OTHER)),
            ...other.map((question) => createSelectSectionBlock(question, existingAnswers)),
        ]),
    ]

    // Only the last question needs block_id, used for error handling in the Slack UI.
    const questionBlocks = [
        ...allQuestionBlocks.slice(0, -1),
        ...allQuestionBlocks.slice(-1).map((it) => ({ ...it, block_id: `feedback-block` })),
    ]

    return [
        ...(existingAnswers != null
            ? [
                  textSection(
                      `:information_source: Du har allerede svart på denne helsesjekken. Men du kan gjerne oppdatere svarene dine.`,
                  ),
              ]
            : []),
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: 'Hvordan står det til?',
                emoji: true,
            },
        },
        ...questionBlocks,
        {
            type: 'context',
            elements: [
                {
                    type: 'plain_text',
                    text: 'Hva du svarer deles ikke med noen. Det brukes kun til å lage helsemetrikker for teamet.',
                    emoji: true,
                },
            ],
        },
    ]
}

function createSelectSectionBlock(question: Question, existingAnswers: QuestionAnswer[] | null): InputBlock {
    const requiredQuestion = question.required ?? true
    const existingAnswer = existingAnswers?.find((a) => a.questionId === question.questionId)
    const options = {
        [AnswerLevel.GOOD]: createRadioOption(question.questionId, `🟢 ${question.answers.HIGH}`, AnswerLevel.GOOD),
        [AnswerLevel.MEDIUM]: createRadioOption(question.questionId, `🟡 ${question.answers.MID}`, AnswerLevel.MEDIUM),
        [AnswerLevel.BAD]: createRadioOption(question.questionId, `🔴 ${question.answers.LOW}`, AnswerLevel.BAD),
    }

    return {
        type: 'input',
        optional: !requiredQuestion,
        label: {
            type: 'plain_text',
            text: `${question.question}`,
        },
        element: {
            action_id: 'radio-button-group-answer',
            type: 'radio_buttons',
            initial_option: existingAnswer != null ? options[existingAnswer.answer] : undefined,
            options: [
                options[AnswerLevel.GOOD],
                options[AnswerLevel.MEDIUM],
                options[AnswerLevel.BAD],
                ...addIf(!requiredQuestion, () => createRadioOption(question.questionId, 'Ikke relevant', null)),
            ],
        },
    }
}

function createRadioOption(id: string, text: string, value: AnswerLevel | null): Option {
    return {
        text: {
            type: 'plain_text',
            text,
            emoji: true,
        },
        value: createIdValue(id, value),
    }
}

function createIdValue(questionId: string, answerLevel: AnswerLevel | null): string {
    return `${questionId}:${answerLevel ?? 'not-applicable'}`
}

export function getIdValueFromAnswer(idValueString: string): [id: string, value: string] {
    const [id, value] = idValueString.split(':')
    return [id, value]
}
