import { App } from '../../app'
import { deleteQuestionFromTeam, getTeam, updateTeam } from '../../../db'
import { dayIndexToDay } from '../../../utils/date'
import { updateResponseCount } from '../../messages/message-poster'
import { QuestionType } from '../../../safe-types'
import { nextOccurenceText, nextOccurrence } from '../../../utils/frequency'

import { createSettingsModal, ModalStateTree, SettingsKeys, SettingsKeys as Keys } from './settings-modal-builder'

export function configureSettingsEventsHandler(app: App): void {
    // Handles users submitting the helsesjekk settings modal
    app.view(Keys.modalSubmit, async ({ ack, view, client, body }) => {
        console.info(`User submitted settings modal`)

        const values: ModalStateTree = view.state.values as unknown as ModalStateTree
        const teamId = view.private_metadata

        const mappedValues = {
            name: values[Keys.teamName.block][Keys.teamName.action].value,
            active: values[Keys.active.block][Keys.active.action].selected_options.length > 0,
            postDay: day(values[Keys.postDay.block][Keys.postDay.action].selected_option.value, 4),
            postHour: hour(values[Keys.postHour.block][Keys.postHour.action].selected_time),
            revealDay: day(values[Keys.revealDay.block][Keys.revealDay.action].selected_option.value, 0),
            revealHour: hour(values[Keys.revealHour.block][Keys.revealHour.action].selected_time),
        }

        const newQuestionMappedValues = values[Keys.newQuestion.blocks.question] ? newQuestionValues(values) : null

        const team = await updateTeam(teamId, mappedValues, newQuestionMappedValues)
        await ack()

        if (!team.active) {
            await client.chat.postEphemeral({
                user: body.user.id,
                channel: teamId,
                text: `Lagret innstillingene for ${team.name}! Jeg er nå deaktivert og vil ikke lenger poste helsesjekker.`,
            })
        } else {
            const { postDate } = nextOccurrence({
                team,
                frequency: team.frequency,
                weekSkew: team.weekSkew,
            })
            await client.chat.postEphemeral({
                user: body.user.id,
                channel: teamId,
                text: `Lagret innstillingene for ${team.name}!\n\nJeg vil legge ut helsesjekken på ${dayIndexToDay(
                    team.postDay,
                )} kl. ${team.postHour}:00 ${nextOccurenceText(postDate)} og vise metrikkene påfølgende ${dayIndexToDay(
                    team.revealDay,
                )} kl. ${team.revealHour}:00`,
            })
        }

        await updateResponseCount(team, client)
    })

    // Handles new custom question click
    app.action(
        { block_id: Keys.addQuestion.block, action_id: Keys.addQuestion.action },
        async ({ ack, body, client }) => {
            if (body.type !== 'block_actions' || !body.view) {
                await ack()

                return
            }

            const team = await getTeam(body.view.private_metadata)
            if (team == null) {
                throw new Error('Unable to update view for team that does not exist')
            }

            await ack()
            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: createSettingsModal(team, true),
            })
        },
    )

    // Handles closing new question form insidie modal
    app.action(
        { block_id: Keys.skipAddQuestion.block, action_id: Keys.skipAddQuestion.action },
        async ({ ack, body, client }) => {
            if (body.type !== 'block_actions' || !body.view) {
                await ack()

                return
            }

            const team = await getTeam(body.view.private_metadata)
            if (team == null) {
                throw new Error('Unable to update view for team that does not exist')
            }

            await ack()
            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: createSettingsModal(team, false),
            })
        },
    )

    app.action(SettingsKeys.deleteQuestion.action, async ({ ack, body, client }) => {
        if (body.type !== 'block_actions' || !body.view) {
            await ack()

            return
        }

        const teamId = body.view.private_metadata
        const questionId = body.actions.at(0)?.block_id

        if (!questionId) {
            throw new Error('Unable to find question id')
        }

        await ack()

        const updatedTeam = await deleteQuestionFromTeam(teamId, questionId)
        await client.views.update({
            view_id: body.view.id,
            hash: body.view.hash,
            view: createSettingsModal(updatedTeam, false),
        })
    })
}

function newQuestionValues(values: ModalStateTree): {
    question: string
    high: string
    mid: string
    low: string
    category: QuestionType
} {
    return {
        question: values[Keys.newQuestion.blocks.question][Keys.newQuestion.actions.question].value,
        high: values[Keys.newQuestion.blocks.answerHigh][Keys.newQuestion.actions.answerHigh].value,
        mid: values[Keys.newQuestion.blocks.answerMid][Keys.newQuestion.actions.answerMid].value,
        low: values[Keys.newQuestion.blocks.answerLow][Keys.newQuestion.actions.answerLow].value,
        category: values[Keys.newQuestion.blocks.category][Keys.newQuestion.actions.category].selected_option
            .value as QuestionType,
    }
}

function hour(value: string): number {
    return +value.split(':')[0]
}

function day(value: string | undefined, fallback: number): number {
    return +(value ?? fallback)
}
