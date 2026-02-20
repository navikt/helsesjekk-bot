import { QuestionType } from '../safe-types'

export function questionTypeToText(type: QuestionType): string {
    switch (type) {
        case QuestionType.ME:
            return 'Meg'
        case QuestionType.SURROUNDINGS:
            return 'Omgivelsene'
        case QuestionType.TEMPERATURE:
            return 'Temperaturmåling'
        case QuestionType.TEAM_HEALTH:
            return 'Teamhelse'
        case QuestionType.SECTION_HEALTH:
            return 'Seksjonshelse'
        case QuestionType.GROUP_HEALTH:
            return 'Gruppehelse'
        case QuestionType.SPEED:
            return 'Fart & flyt'
        case QuestionType.TECH:
            return 'Teknisk'
        case QuestionType.OTHER:
            return 'Annet'
    }
}
