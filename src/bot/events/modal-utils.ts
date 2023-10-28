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

export function addIf<T>(condition: boolean, block: () => T | T[]): T[] {
    if (condition) {
        const result = block()
        return Array.isArray(result) ? result : [result]
    }
    return []
}
