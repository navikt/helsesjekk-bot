import { expect, mock } from 'bun:test'

export function mockDate(date: Date): void {
    mock.module('../src/utils/date.ts', () => ({
        getNowInNorway: () => date,
    }))
}

export function expectNoError<Result extends { error: ErrorType } | unknown, ErrorType extends Error | string>(
    result: Result,
): asserts result is Exclude<Result, { error: ErrorType }> {
    expect(result).not.toHaveProperty('error')
}
