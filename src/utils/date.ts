import { getDay, getWeek, differenceInDays, differenceInHours } from 'date-fns'
import { nb } from 'date-fns/locale'

export function getWeekNumber(date: Date): number {
    return getWeek(date, { weekStartsOn: 1, locale: nb })
}

export function getNowInNorway(): Date {
    return new Date(new Date().toLocaleString('en', { timeZone: 'Europe/Oslo' }))
}

export function getDayCorrect(date: Date): number {
    return (getDay(date) + 6) % 7
}

const days = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
export function dayIndexToDay(index: number): string {
    return days[index]
}

export function daysUntil(date: Date): number {
    const now = getNowInNorway()
    return differenceInDays(date, now)
}

export function hoursUntil(date: Date): number {
    const now = getNowInNorway()
    return differenceInHours(date, now)
}
