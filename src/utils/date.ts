import { getDay, getWeek } from 'date-fns'

export function getWeekNumber(date: Date): number {
    return getWeek(date, { weekStartsOn: 1 }) - 1
}

export function getNowInNorway() {
    return new Date(new Date().toLocaleString('en', { timeZone: 'Europe/Oslo' }))
}

export function getDayCorrect(date: Date) {
    return (getDay(date) + 6) % 7
}

const days = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
export function dayIndexToDay(index: number) {
    return days[index]
}
