import { describe, expect, test } from 'bun:test'
import { parseISO } from 'date-fns'

import { mockDate } from '../../tests/utils'

import { Frequency, getRelevantWeeks, nextOccurrence } from './frequency'

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

        expect(postDate).toEqual(parseISO('2023-05-05T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeTrue()
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

    test('repro case: hour has passed but day is tomorrow, should correctly build postDates', () => {
        mockDate(new Date('2023-11-09T09:35:41.912Z'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 8,
            },
            frequency: Frequency.WEEKLY,
            weekSkew: 0,
        })

        expect(postDate).toEqual(parseISO('2023-11-10T08:35:41.912Z'))
        expect(isThisWeekRelevant).toBeTrue()
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

    describe('year overflow', () => {
        test('week before last week (skew+0), so time is this year', () => {
            mockDate(new Date('2023-12-22T11:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.BIWEEKLY,
                weekSkew: 2,
            })

            expect(postDate).toEqual(parseISO('2023-12-29T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed so next ask is next year', () => {
            mockDate(new Date('2023-12-29T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.BIWEEKLY,
                weekSkew: 0,
            })

            expect(postDate).toEqual(parseISO('2024-01-12T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed, and next ask is next year because of skew+1', () => {
            mockDate(new Date('2023-12-22T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.BIWEEKLY,
                weekSkew: 1,
            })

            expect(postDate).toEqual(parseISO('2024-01-05T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })
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

    test('same day, but week is skewed+1, should provide week in two weeks as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 1,
        })

        expect(postDate).toEqual(parseISO('2023-05-19T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    test('same day, but week is skewed+2, should provide next week as nextDate', () => {
        mockDate(new Date('2023-05-05T11:37:00'))

        const { postDate, isThisWeekRelevant } = nextOccurrence({
            team: {
                postDay: 4,
                postHour: 12,
            },
            frequency: Frequency.TRIWEEKLY,
            weekSkew: 2,
        })

        expect(postDate).toEqual(parseISO('2023-05-12T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    describe('year overflow', () => {
        test('week before last week (skew+2), so time is this year', () => {
            mockDate(new Date('2023-12-22T11:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.TRIWEEKLY,
                weekSkew: 2,
            })

            expect(postDate).toEqual(parseISO('2023-12-29T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed so next ask is next year', () => {
            mockDate(new Date('2023-12-22T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.TRIWEEKLY,
                weekSkew: 0,
            })

            expect(postDate).toEqual(parseISO('2024-01-19T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed, and next ask is next year because of skew+1', () => {
            mockDate(new Date('2023-12-15T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.TRIWEEKLY,
                weekSkew: 1,
            })

            expect(postDate).toEqual(parseISO('2024-01-12T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed, and next ask is next year because of skew+2', () => {
            mockDate(new Date('2023-12-29T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.TRIWEEKLY,
                weekSkew: 2,
            })

            expect(postDate).toEqual(parseISO('2024-01-05T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })
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

        expect(postDate).toEqual(parseISO('2023-06-09T12:37:00.000Z'))
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

        expect(postDate).toEqual(parseISO('2023-05-26T12:37:00.000Z'))
        expect(isThisWeekRelevant).toBeFalse()
    })

    describe('year overflow', () => {
        test('week before last week (skew 0), so time is this year', () => {
            mockDate(new Date('2023-12-22T11:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.FOURWEEKLY,
                weekSkew: 0,
            })

            expect(postDate).toEqual(parseISO('2023-12-29T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed so next ask is next year', () => {
            mockDate(new Date('2023-12-29T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.FOURWEEKLY,
                weekSkew: 0,
            })

            expect(postDate).toEqual(parseISO('2024-01-26T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed, and next ask is next year because of skew+1', () => {
            mockDate(new Date('2023-12-22T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.FOURWEEKLY,
                weekSkew: 1,
            })

            expect(postDate).toEqual(parseISO('2024-01-19T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('relevant week, but time has passed, and next ask is next year because of skew+2', () => {
            mockDate(new Date('2023-12-22T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.FOURWEEKLY,
                weekSkew: 2,
            })

            expect(postDate).toEqual(parseISO('2024-01-12T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })

        test('not relevant week, but next ask is next year because of skew+3', () => {
            mockDate(new Date('2023-12-22T13:37:00'))

            const { postDate, isThisWeekRelevant } = nextOccurrence({
                team: {
                    postDay: 4,
                    postHour: 12,
                },
                frequency: Frequency.FOURWEEKLY,
                weekSkew: 3,
            })

            expect(postDate).toEqual(parseISO('2024-01-05T12:37:00.000Z'))
            expect(isThisWeekRelevant).toBeFalse()
        })
    })
})

describe('getRelevantWeeks', () => {
    const january = new Date(2023, 0, 15)

    test('Should provide correct weeks for frequency WEEKLY', () => {
        expect(getRelevantWeeks(january, Frequency.WEEKLY, 0)).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
        ])
    })

    test('Should provide correct weeks for frequency BIWEEKLY', () => {
        expect(getRelevantWeeks(january, Frequency.BIWEEKLY, 0)).toEqual([
            2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52,
        ])
    })

    test('Should provide correct weeks for frequency BIWEEKLY with skew+1', () => {
        expect(getRelevantWeeks(january, Frequency.BIWEEKLY, 1)).toEqual([
            1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51,
        ])
    })

    test('Should provide correct weeks for frequency TRIWEEKLY', () => {
        expect(getRelevantWeeks(january, Frequency.TRIWEEKLY, 0)).toEqual([
            3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51,
        ])
    })

    test('Should provide correct weeks for frequency TRIWEEKLY with skew+1', () => {
        expect(getRelevantWeeks(january, Frequency.TRIWEEKLY, 1)).toEqual([
            2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50,
        ])
    })

    test('Should provide correct weeks for frequency TRIWEEKLY with skew+2', () => {
        expect(getRelevantWeeks(january, Frequency.TRIWEEKLY, 2)).toEqual([
            1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52,
        ])
    })

    test('Should provide correct weeks for frequency FOURWEEKLY', () => {
        expect(getRelevantWeeks(january, Frequency.FOURWEEKLY, 0)).toEqual([
            4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52,
        ])
    })

    test('Should provide correct weeks for frequency FOURWEEKLY with skew+1', () => {
        expect(getRelevantWeeks(january, Frequency.FOURWEEKLY, 1)).toEqual([
            3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51,
        ])
    })

    test('Should provide correct weeks for frequency FOURWEEKLY with skew+2', () => {
        expect(getRelevantWeeks(january, Frequency.FOURWEEKLY, 2)).toEqual([
            2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50,
        ])
    })
    test('Should provide correct weeks for frequency FOURWEEKLY with skew+3', () => {
        expect(getRelevantWeeks(january, Frequency.FOURWEEKLY, 3)).toEqual([
            1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49,
        ])
    })
})
