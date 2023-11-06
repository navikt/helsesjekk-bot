import { mock } from 'bun:test'

export function mockDate(date: Date): void {
    mock.module('../src/utils/date.ts', () => ({
        getNowInNorway: () => date,
    }))
}
