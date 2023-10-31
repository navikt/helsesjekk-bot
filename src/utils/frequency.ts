import * as R from 'remeda'
import { setDay, getISOWeeksInYear, setWeek } from 'date-fns'

import { getNowInNorway, getWeekNumber } from './date'

export function nextAsk({
    postDay,
    frequency,
    weekSkew,
}: {
    postDay: number
    frequency: number
    weekSkew: number
}): [date: Date, isThisWeek: boolean] {
    const now = getNowInNorway()
    if (frequency === 1) {
        return [setDay(now, postDay, { weekStartsOn: 1 }), true]
    }

    const relevantWeeks = R.range(0, getISOWeeksInYear(now))
        .filter((week) => week % frequency === 0)
        .map((week) => week + weekSkew)
    const currentWeek = getWeekNumber(now)
    const nextWeek = relevantWeeks.find((week) => week >= currentWeek)

    if (nextWeek === currentWeek) {
        return [setDay(now, postDay, { weekStartsOn: 1 }), true]
    }

    const nextWeekDate = setWeek(setDay(now, postDay, { weekStartsOn: 1 }), nextWeek + 1, { weekStartsOn: 1 })
    return [nextWeekDate, false]
}
