import { Block, KnownBlock } from '@slack/types'
import { Option, SectionBlock } from '@slack/bolt'
import { AnswerLevel } from '@prisma/client'

import { Question } from '../db/types'

export function createBlocks(teamName: string, questions: Question[]): (KnownBlock | Block)[] {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `Det er på tide med ukentlig helsesjekk for ${teamName}! :wave:`,
                emoji: true,
            },
        },
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: 'Hvordan står det til?',
                emoji: true,
            },
        },
        ...questions.map((question) => createSelectSectionBlock(question)),
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

function createSelectSectionBlock(question: Question): SectionBlock {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*${question.question}*`,
        },
        accessory: {
            action_id: 'radio-button-group-answer',
            type: 'radio_buttons',
            options: [
                createRadioOption(question.questionId, `🟢 ${question.answers.HIGH}`, AnswerLevel.GOOD),
                createRadioOption(question.questionId, `🟡 ${question.answers.MID}`, AnswerLevel.MEDIUM),
                createRadioOption(question.questionId, `🔴 ${question.answers.LOW}`, AnswerLevel.BAD),
            ],
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
