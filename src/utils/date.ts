import { getDay, getWeek } from 'date-fns'

export function getWeekNumberNow(): number {
    return getWeek(getNowInNorway(), { weekStartsOn: 1 }) - 1
}

export function getNowInNorway() {
    return new Date(new Date().toLocaleString('en', { timeZone: 'Europe/Oslo' }))
}

export function getDayCorrect(date: Date) {
    return (getDay(date) + 6) % 7
}
