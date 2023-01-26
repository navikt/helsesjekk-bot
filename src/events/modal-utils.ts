import { HeaderBlock, SectionBlock } from '@slack/bolt'

export function plainHeader(text: string): HeaderBlock {
    return {
        type: 'header',
        text: { text, type: 'plain_text' },
    }
}

export function textSection(text: string): SectionBlock {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text,
        },
    }
}
