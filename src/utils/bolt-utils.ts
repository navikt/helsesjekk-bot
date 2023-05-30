import { PlainTextElement } from '@slack/bolt'

export function text(text: string): PlainTextElement {
    return {
        type: 'plain_text',
        text,
        emoji: true,
    }
}
