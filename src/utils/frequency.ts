import * as R from 'remeda'
import { getISOWeeksInYear, setWeekWithOptions, setDayWithOptions, setHours, getDay } from 'date-fns/fp'

import { getNowInNorway, getWeekNumber } from './date'

export function nextOccurrence({
    day,
    hour,
    frequency,
    weekSkew,
}: {
    day: number
    hour: number
    frequency: number
    weekSkew: number
}): [date: Date, isThisWeek: boolean] {
    const now = getNowInNorway()
    const currentWeek = getWeekNumber(now)
    if (frequency === 1) {
        if (getDay(now) > day + 1) {
            return [setWeekDayHour(currentWeek + 2, day + 1, hour)(now), false]
        } else {
            return [setDayHour(day + 1, hour)(now), true]
        }
    }

    const relevantWeeks = R.range(0, getISOWeeksInYear(now))
        .filter((week) => week % frequency === 0)
        .map((week) => week + weekSkew)

    const nextWeek = relevantWeeks.find((week) => week >= currentWeek)

    if (nextWeek === currentWeek) {
        if (getDay(now) > day + 1) {
            return [setWeekDayHour(currentWeek + 2, day + 1, hour)(now), false]
        } else {
            return [setDayHour(day + 1, hour)(now), true]
        }
    }

    const nextWeekDate = setWeekDayHour(nextWeek + 2, day + 1, hour)(now)
    return [nextWeekDate, false]
}

const setWeekDayHour = (week: number, day: number, hour: number): ((date: Date) => Date) =>
    R.createPipe(
        setHours(hour),
        setDayWithOptions({ weekStartsOn: 1 })(day),
        setWeekWithOptions({ weekStartsOn: 1 })(week),
    )

const setDayHour = (day: number, hour: number): ((date: Date) => Date) =>
    R.createPipe(setHours(hour), setDayWithOptions({ weekStartsOn: 1 })(day))
