import { Block, KnownBlock } from '@slack/types'
import { InputBlock, ModalView, Option } from '@slack/bolt'
import { groupBy } from 'remeda'

import { AnswerLevel, Team, Asked, Question, QuestionAnswer, QuestionType } from '../../../db'
import { questionsFromJsonb } from '../../../questions/jsonb-utils'
import { addIf, plainHeader, textSection } from '../modal-utils'
import { questionTypeToText } from '../../../utils/asked'

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
        blocks: createHealthCheckModalBlocks(team.name, questionsFromJsonb(asked.questions), userId, existingAnswers),
    }
}

export function createHealthCheckModalBlocks(
    teamName: string,
    questions: Question[],
    userId: string,
    existingAnswers: QuestionAnswer[] | null,
): (KnownBlock | Block)[] {
    const grouped: Record<QuestionType, Question[]> = groupBy(questions, (q) => q.type)

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
        plainHeader(questionTypeToText(QuestionType.TEAM_HEALTH)),
        ...grouped.TEAM_HEALTH.map((question) => createSelectSectionBlock(question, false, existingAnswers)),
        plainHeader(questionTypeToText(QuestionType.SPEED)),
        ...grouped.SPEED.map((question, index) =>
            createSelectSectionBlock(
                question,
                index === grouped.SPEED.length - 1 && grouped.TECH == null && grouped.OTHER == null,
                existingAnswers,
            ),
        ),
        ...addIf(grouped.TECH && grouped.TECH.length > 0, () => [
            plainHeader(questionTypeToText(QuestionType.TECH)),
            ...grouped.TECH.map((question, index) =>
                createSelectSectionBlock(
                    question,
                    index === grouped.TECH.length - 1 && grouped.OTHER == null,
                    existingAnswers,
                ),
            ),
        ]),
        ...addIf(grouped.OTHER && grouped.OTHER.length > 0, () => [
            plainHeader(questionTypeToText(QuestionType.OTHER)),
            ...grouped.OTHER.map((question, index) =>
                createSelectSectionBlock(question, index === grouped.OTHER.length - 1, existingAnswers),
            ),
        ]),
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

function createSelectSectionBlock(
    question: Question,
    isLast = false,
    existingAnswers: QuestionAnswer[] | null,
): InputBlock {
    const existingAnswer = existingAnswers?.find((a) => a.questionId === question.questionId)
    const options = {
        [AnswerLevel.GOOD]: createRadioOption(question.questionId, `🟢 ${question.answers.HIGH}`, AnswerLevel.GOOD),
        [AnswerLevel.MEDIUM]: createRadioOption(question.questionId, `🟡 ${question.answers.MID}`, AnswerLevel.MEDIUM),
        [AnswerLevel.BAD]: createRadioOption(question.questionId, `🔴 ${question.answers.LOW}`, AnswerLevel.BAD),
    }

    return {
        type: 'input',
        label: {
            type: 'plain_text',
            text: `${question.question}`,
        },
        block_id: isLast ? `feedback-block` : undefined,
        element: {
            action_id: 'radio-button-group-answer',
            type: 'radio_buttons',
            initial_option: existingAnswer != null ? options[existingAnswer.answer] : undefined,
            options: [options[AnswerLevel.GOOD], options[AnswerLevel.MEDIUM], options[AnswerLevel.BAD]],
        },
    }
}

function createRadioOption(id: string, text: string, value: AnswerLevel): Option {
    return {
        text: {
            type: 'plain_text',
            text,
            emoji: true,
        },
        value: createIdValue(id, value),
    }
}

function createIdValue(questionId: string, answerLevel: AnswerLevel): string {
    return `${questionId}:${answerLevel}`
}

export function getIdValueFromAnswer(idValueString: string): [id: string, value: string] {
    const [id, value] = idValueString.split(':')
    return [id, value]
}
