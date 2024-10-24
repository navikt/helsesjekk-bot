import * as R from 'remeda'

import { App } from '../../app'
import { MessageActions } from '../../messages/message-builder'
import { answerFromJsonb } from '../../../questions/jsonb-utils'
import { getTeam, getActiveAsk, getAsked, answerQuestions, getAnswer } from '../../../db'
import { updateResponseCount } from '../../messages/message-poster'

import { createHealthCheckModal, getIdValueFromAnswer, HealthcheckModalActions } from './healthcheck-modal-builder'

export function configureHealthCheckEventsHandler(app: App): void {
    // User clicks fill out helsesjekk button, so we open the modal with the form
    app.action(MessageActions.FillButtonClicked, async ({ ack, action, body, client }) => {
        console.info(`User clicked fill out helsesjekk button, opening modal`)

        if (action.type !== 'button' || body.type !== 'block_actions') {
            throw new Error(
                `${MessageActions.FillButtonClicked} id used for something else than a button: ${action.type}, ${body.type}`,
            )
        }

        await ack()

        const userId = body.user.id
        const channelId = body.channel?.id ?? ''
        const team = await getTeam(channelId)
        const asked = await getAsked(channelId, body.message?.ts ?? '')

        if (team == null || asked == null) {
            console.error(
                `Someone tried to fill out a healthcheck, but we couldn't find the team or asked, team: ${channelId}, asked-ts: ${
                    body.message?.ts ?? ''
                }`,
            )

            await client.chat.postEphemeral({
                channel: channelId,
                text: ':tennepaadass2: Det ser ut som du svarer på et spørsmål som aldri er spurt. :meow-shocked: Kan du ta kontakt i <#C04LG229SE7>? :smile:',
                user: userId,
            })
            return
        }

        const answer = await getAnswer(userId, asked.id)
        const answers = answer?.answers ? answerFromJsonb(answer.answers) : null

        await client.views.open({
            trigger_id: body.trigger_id,
            view: createHealthCheckModal(team, asked, userId, answers),
        })
    })

    // Health check modal submit, put the answers in the database. Slack makes sure we have all answers.
    app.view(HealthcheckModalActions.modalSubmit, async ({ ack, view, body, client }) => {
        console.info(`User submitted healthcheck modal`)

        const answers: [questionId: string, value: string][] = R.pipe(
            view.state.values,
            R.values(),
            R.map(R.prop('radio-button-group-answer')),
            R.filter((it) => it.selected_option != null),
            R.map((it) => it.selected_option?.value ?? ''),
            R.map(getIdValueFromAnswer),
            R.filter(([, value]) => value !== 'not-applicable'),
        )

        const userId = body.user.id
        const channelId = view.private_metadata ?? 'unknown'
        const team = await getTeam(channelId)
        const asked = await getActiveAsk(channelId)

        if (team == null || asked == null) {
            await client.chat.postEphemeral({
                channel: channelId,
                text: ':tennepaadass2: Det ser ut som du svarer på et spørsmål som aldri er spurt. :meow-shocked: Kan du ta kontakt i <#C04LG229SE7>? :smile:',
                user: userId,
            })
            return ack({
                response_action: 'errors',
                errors: {
                    'feedback-block':
                        'Det ser ut som du svarer på et spørsmål som aldri er spurt. Kan du ta kontakt i #helsesjek-bot?',
                },
            })
        }

        await answerQuestions(asked, answers, body.user.id)
        await ack()
        await updateResponseCount(team, client)
    })
}
