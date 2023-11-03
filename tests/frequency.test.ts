import { describe, test, expect, mock } from 'bun:test'
import { parseISO } from 'date-fns'

import { Frequency, nextOccurrence } from '../src/utils/frequency.ts'

describe('weekly frequency', () => {
    test('same day, should provide today as nextDate', () => {
        mockDate(new Date('2023-05-05T09:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.WEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-05T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeTrue()
    })

    test('same day, hour has passed, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-05T13:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.WEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-12T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('day of week has passed, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-06T09:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.WEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-12T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })
})

describe('biweekly frequency', () => {
    test('same day, should provide today as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.BIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-05T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeTrue()
    })

    test('same day, hour has passed, should provide week in two weeks as nextDate', () => {
        mockDate(new Date('2023-05-05T14:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.BIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-19T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('day has passed, should provide week in two weeks as nextDate', () => {
        mockDate(new Date('2023-05-06T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.BIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-19T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+1, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.BIWEEKLY,
            weekSkew: 1,
        })

        expect(postDate).toEqual(parseISO('2023-05-12T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })
})

describe('triweekly frequency', () => {
    test('same day, should provide today as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-05T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeTrue()
    })

    test('same day, hour has passed, should provide three weeks ahead as nextDate', () => {
        mockDate(new Date('2023-05-05T14:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-26T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('day has passed, should provide three weeks ahead as nextDate', () => {
        mockDate(new Date('2023-05-06T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-26T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+1, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 1,
        })

        expect(postDate).toEqual(parseISO('2023-05-12T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+2, should provide week in two weeks as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 2,
        })

        expect(postDate).toEqual(parseISO('2023-05-19T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })
})

describe('four-weekly frequency', () => {
    test('same day, should provide today as nextDate', () => {
        mockDate(new Date('2023-05-19T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-05-19T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeTrue()
    })

    test('same day, hour has passed, should provide week in four weeks as nextDate', () => {
        mockDate(new Date('2023-05-19T14:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-06-16T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('day has passed, should provide week in four weeks as nextDate', () => {
        mockDate(new Date('2023-05-20T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-06-16T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed + 1, should provide week in three weeks as nextDate', () => {
        mockDate(new Date('2023-05-19T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 1,
        })

        expect(postDate).toEqual(parseISO('2023-05-26T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+2, should provide week in two weeks as nextDate', () => {
        mockDate(new Date('2023-05-19T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 2,
        })

        expect(postDate).toEqual(parseISO('2023-06-02T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+3, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-19T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.FOURWEEKLY,
            weekSkew: 3,
        })

        expect(postDate).toEqual(parseISO('2023-06-09T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })
})

function mockDate(date: Date): void {
    mock.module('../src/utils/date.ts', () => ({
        getNowInNorway: () => date,
    }))
}
