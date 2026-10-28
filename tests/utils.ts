import { expect } from 'vitest'

// oxlint-disable-next-line typescript/no-redundant-type-constituents
export function expectNoError<Result extends { error: ErrorType } | unknown, ErrorType extends Error | string>(
    result: Result,
): asserts result is Exclude<Result, { error: ErrorType }> {
    expect(result).not.toHaveProperty('error')
}
