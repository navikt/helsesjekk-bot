import { v4 as uuidV4 } from 'uuid'

import { Question, QuestionType } from '../safe-types'

export function defaultQuestions(): Question[] {
    return [
        {
            questionId: uuidV4(),
            question: 'Stress',
            answers: {
                HIGH: 'Ting er behagelige og jeg kjenner meg ikke stresset',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Jeg er stresset og opplever ubehag i forbindelse med jobben',
            },
            type: QuestionType.TEAM_HEALTH,
        },
        {
            questionId: uuidV4(),
            question: 'Feedback',
            answers: {
                HIGH: 'Vi støtter hverandres utvikling ved å gi hverandre positiv og kontruktiv feedback',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Vi vet ikke hvordan vi skal gi hverandre feedback på en konstruktiv måte',
            },
            type: QuestionType.TEAM_HEALTH,
        },
        {
            questionId: uuidV4(),
            question: 'Samarbeid',
            answers: {
                HIGH: 'Vi er et godt fungerende team der samarbeidet fungerer strålende',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Vi er en gjeng individualister der alle driver på med sine egne greier. Jeg aner ikke hva de andre gjør',
            },
            type: QuestionType.TEAM_HEALTH,
        },
        {
            questionId: uuidV4(),
            question: 'Støtte',
            answers: {
                HIGH: 'Vi får all hjelp vi trenger fra de rundt oss',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Ting stopper opp hele tiden fordi vi må vente på andre',
            },
            type: QuestionType.SPEED,
        },
        {
            questionId: uuidV4(),
            question: 'Fart',
            answers: {
                HIGH: 'Vi får gjort ting raskt',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Ting stopper opp hele tiden. Vi er aldri enige om hva som har prioritet eller hvordan ting skal løses',
            },
            type: QuestionType.SPEED,
        },
        {
            questionId: uuidV4(),
            question: 'Oppdrag',
            answers: {
                HIGH: 'Vi vet akkurat hvorfor vi er her og vi digger det',
                MID: 'Litt sånn midt i mellom',
                LOW: 'Vi vet ikke helt hvor vi skal. Oppdraget vårt er lite tydelig og ikke inspirerende',
            },
            type: QuestionType.SPEED,
        },
    ]
}
