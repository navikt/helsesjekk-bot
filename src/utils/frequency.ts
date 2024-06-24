import * as R from 'remeda'
import {
    getISOWeeksInYear,
    setWeekWithOptions,
    setDayWithOptions,
    setHours,
    getDay,
    getHours,
    isBefore,
    setYear,
    getYear,
    isValid,
} from 'date-fns/fp'
import { nb } from 'date-fns/locale'

import { daysUntil, getNowInNorway, getWeekNumber, hoursUntil } from './date'
import { raise } from './ts-utils'

export enum Frequency {
    WEEKLY = 1,
    BIWEEKLY = 2,
    TRIWEEKLY = 3,
    FOURWEEKLY = 4,
}

type NextOccurence = {
    team: {
        postDay: number
        postHour: number
    }
    frequency: number
    weekSkew: number
}

type NextOccurencePeriod = {
    postDate: Date
    isThisWeekRelevant: boolean
}

export function nextOccurrence({ team, frequency, weekSkew }: NextOccurence): NextOccurencePeriod {
    const now = getNowInNorway()
    const currentWeek = getWeekNumber(now)

    if (frequency === Frequency.WEEKLY) {
        if (getDay(now) > team.postDay + 1) {
            return {
                postDate: setWeekDayHour(currentWeek + 1, team.postDay + 1, team.postHour)(now),
                isThisWeekRelevant: false,
            }
        } else if (getHours(now) > team.postHour) {
            return {
                postDate: setWeekDayHour(currentWeek, team.postDay + 1, team.postHour)(now),
                isThisWeekRelevant: true,
            }
        } else {
            return { postDate: setDayHour(team.postDay + 1, team.postHour)(now), isThisWeekRelevant: true }
        }
    }

    const relevantWeeks = getRelevantWeeks(now, frequency, weekSkew)
    const relevantWeek: number | undefined = relevantWeeks.find((week) => week >= currentWeek)
    const relevantWeekDate: Date | null = relevantWeek
        ? setWeekDayHour(relevantWeek, team.postDay + 1, team.postHour)(now)
        : null

    if (
        currentWeek + frequency > getISOWeeksInYear(now) &&
        (relevantWeek == null || !isValid(relevantWeekDate) || (relevantWeekDate && isBefore(now, relevantWeekDate)))
    ) {
        // Handle year overflow, find the first relevant week to post for next year
        const nextYearInitialWeek = setYearWeekDayHour(getYear(now) + 1, 1, team.postDay + 1, team.postHour)(now)
        const nextYearFirstRelevantWeek = getRelevantWeeks(nextYearInitialWeek, frequency, weekSkew)[0]
        const relevantNextYearDate = setYearWeekDayHour(
            getYear(now) + 1,
            nextYearFirstRelevantWeek,
            team.postDay + 1,
            team.postHour,
        )(now)

        return { postDate: relevantNextYearDate, isThisWeekRelevant: false }
    }

    // Is this year
    if (relevantWeekDate && isBefore(now, relevantWeekDate)) {
        const upcomingRelevantWeek =
            relevantWeeks.find((week) => week > currentWeek) ?? raise(new Error('Unable to find upcoming week'))
        return {
            postDate: setWeekDayHour(upcomingRelevantWeek, team.postDay + 1, team.postHour)(now),
            isThisWeekRelevant: false,
        }
    } else {
        return {
            postDate: relevantWeekDate ?? raise(new Error("Illegal state: Date can't be null at this point")),
            isThisWeekRelevant: relevantWeek === currentWeek,
        }
    }
}

const setWeekDayHour = (week: number, day: number, hour: number): ((date: Date) => Date) =>
    R.piped(
        setWeekWithOptions({ weekStartsOn: 1, locale: nb })(week),
        setDayWithOptions({ weekStartsOn: 1, locale: nb })(day),
        setHours(hour),
    )

const setYearWeekDayHour = (year: number, week: number, day: number, hour: number): ((date: Date) => Date) =>
    R.piped(setYear(year), setWeekDayHour(week, day, hour))

const setDayHour = (day: number, hour: number): ((date: Date) => Date) =>
    R.piped(setHours(hour), setDayWithOptions({ weekStartsOn: 1 })(day))

export function nextOccurenceText(occurence: Date): string {
    const days = daysUntil(occurence)
    const hours = hoursUntil(occurence)

    if (hours === 0) {
        return 'denne timen, eller har allerede blitt lagt ut'
    }

    return hours < 24 ? `om ${hours} timer` : days === 0 ? 'i dag' : `om ${days + 1} dager`
}

export function getWeekNumbersInYear(now: Date): [thisYear: number[], nextYear: number[]] {
    return [R.range(1, getISOWeeksInYear(now) + 1), R.range(1, 5)]
}

export function getRelevantWeeks(now: Date, frequency: number, weekSkew: number): number[] {
    const [thisYear] = getWeekNumbersInYear(now)
    return thisYear.filter((week) => (week + weekSkew) % frequency === 0)
}
