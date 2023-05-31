import { toPairs } from 'remeda'

export function toPairsTyped<Key extends string, T>(items: Record<Key, T>): [Key, T][] {
    return toPairs(items) as [Key, T][]
}
