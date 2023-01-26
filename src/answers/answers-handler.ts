import { App } from '../app'
import { answerQuestion, getAsked, hasUserAnsweredAllQuestionsForAsked } from '../db/prisma'
import { getIdValueFromAnswer } from '../messages/message-builder'

export function configureAnswersHandlers(app: App): void {
    /* When users in the slack channel fill out the questionnaire, we'll get an event per question. Not as a single submitted form. */
    app.action('radio-button-group-answer', async ({ ack, action, body, client }) => {
        if (!('message' in body) || body.message == null) {
            throw new Error(`Illegal state: Missing message in body`)
        }

        if (action.type !== 'radio_buttons') {
            throw new Error(
                `Illegal state: ID radio-butto-group-answer used for something not a radio button: ${action.type}`,
            )
        }

        if (action.selected_option?.value == null) {
            throw new Error(`Illegal state: Missing value for selected radio button`)
        }

        const userId = body.user.id
        const channelId = body.channel?.id ?? 'unknown'
        const [questionId, value] = getIdValueFromAnswer(action.selected_option.value)
        const asked = await getAsked(channelId, body.message.ts)

        if (asked == null) {
            await client.chat.postEphemeral({
                channel: channelId,
                text: ':tennepaadass2: Det ser ut som du svarer på et spørsmål som aldri er spurt. :meow-shocked: Kan du ta kontakt i <#C04LG229SE7>? :smile:',
                user: userId,
            })
            return
        }

        await answerQuestion(asked, userId, channelId, questionId, value)
        await ack()

        if (await hasUserAnsweredAllQuestionsForAsked(asked, userId)) {
            await client.chat.postEphemeral({
                channel: channelId,
                text: 'Takk for svaret! :smile:',
                user: userId,
            })
        }
    })
}
