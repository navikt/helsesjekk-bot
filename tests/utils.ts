import { expect } from 'vitest'

export function expectNoError<Result extends { error: ErrorType } | unknown, ErrorType extends Error | string>(
    result: Result,
): asserts result is Exclude<Result, { error: ErrorType }> {
    expect(result).not.toHaveProperty('error')
}
