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
    day: number
    hour: number
    frequency: number
    weekSkew: number
}

export function nextOccurrence({ day, hour, frequency, weekSkew }: NextOccurence): [date: Date, isThisWeek: boolean] {
    const now = getNowInNorway()
    const currentWeek = getWeekNumber(now)

    if (frequency === Frequency.WEEKLY) {
        if (getDay(now) > day + 1 || getHours(now) > hour) {
            return [setWeekDayHour(currentWeek + 1, day + 1, hour)(now), false]
        } else {
            return [setDayHour(day + 1, hour)(now), true]
        }
    }

    const relevantWeeks = R.range(0, getISOWeeksInYear(now))
        .filter((week) => week % frequency === 0)
        .map((week) => week + weekSkew)

    const relevantWeek = relevantWeeks.find((week) => week >= currentWeek)
    const relevantWeekDate = setWeekDayHour(relevantWeek, day + 1, hour)(now)

    if (isBefore(now, relevantWeekDate)) {
        const upcomingRelevantWeek = relevantWeeks.find((week) => week > currentWeek)
        return [setWeekDayHour(upcomingRelevantWeek, day + 1, hour)(now), false]
    } else {
        return [relevantWeekDate, relevantWeek === currentWeek]
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
