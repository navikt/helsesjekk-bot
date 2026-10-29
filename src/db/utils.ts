import { NoResultError } from './errors'

/**
 * Mirrors prisma's behaviour of throwing when an update/delete/findOrThrow does not match any rows.
 */
export function firstOrThrow<T>(rows: T[], what: string): T {
    const [first] = rows
    if (first === undefined) {
        throw new NoResultError(what)
    }
    return first
}
