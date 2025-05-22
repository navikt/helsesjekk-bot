import { PlainTextElement } from '@slack/types'

export function text(text: string): PlainTextElement {
    return {
        type: 'plain_text',
        text,
        emoji: true,
    }
}
