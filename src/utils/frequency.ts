import * as R from 'remeda'
import {
    getISOWeeksInYear,
    setWeekWithOptions,
    setDayWithOptions,
    setHours,
    getDay,
    getHours,
    isBefore,
} from 'date-fns/fp'
import { nb } from 'date-fns/locale'

import { daysUntil, getNowInNorway, getWeekNumber, hoursUntil } from './date'

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
        if (getDay(now) > team.postDay + 1 || getHours(now) > team.postHour) {
            return {
                postDate: setWeekDayHour(currentWeek + 1, team.postDay + 1, team.postHour)(now),
                isThisWeekRelevant: false,
            }
        } else {
            return { postDate: setDayHour(team.postDay + 1, team.postHour)(now), isThisWeekRelevant: true }
        }
    }

    const relevantWeeks = getRelevantWeeks(now, frequency, weekSkew)
    const relevantWeek = relevantWeeks.find((week) => week >= currentWeek)
    const relevantWeekDate = setWeekDayHour(relevantWeek, team.postDay + 1, team.postHour)(now)

    if (isBefore(now, relevantWeekDate)) {
        const upcomingRelevantWeek = relevantWeeks.find((week) => week > currentWeek)
        return {
            postDate: setWeekDayHour(upcomingRelevantWeek, team.postDay + 1, team.postHour)(now),
            isThisWeekRelevant: false,
        }
    } else {
        return { postDate: relevantWeekDate, isThisWeekRelevant: relevantWeek === currentWeek }
    }
}

const setWeekDayHour = (week: number, day: number, hour: number): ((date: Date) => Date) =>
    R.createPipe(
        setWeekWithOptions({ weekStartsOn: 1, locale: nb })(week),
        setDayWithOptions({ weekStartsOn: 1, locale: nb })(day),
        setHours(hour),
    )

const setDayHour = (day: number, hour: number): ((date: Date) => Date) =>
    R.createPipe(setHours(hour), setDayWithOptions({ weekStartsOn: 1 })(day))

export function nextOccurenceText(occurence: Date): string {
    const days = daysUntil(occurence)
    const hours = hoursUntil(occurence)

    if (hours === 0) {
        return 'denne timen, eller har allerede blitt lagt ut'
    }

    return hours < 24 ? `om ${hours} timer` : days === 0 ? 'i dag' : `om ${days + 1} dager`
}

export function getRelevantWeeks(now: Date, frequency: number, weekSkew: number): number[] {
    return R.range(0, getISOWeeksInYear(now))
        .filter((week) => week % frequency === 0)
        .map((week) => week + weekSkew)
}
