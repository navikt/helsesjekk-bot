import { Question, QuestionType } from '../src/safe-types'

export const testQuestions: Question[] = [
    {
        questionId: 'question-1',
        question: 'How are you?',
        answers: {
            LOW: 'Not good',
            MID: 'Okay',
            HIGH: 'Great',
        },
        type: QuestionType.TEAM_HEALTH,
        custom: true,
    },
    {
        questionId: 'question-2',
        question: 'How was your day?',
        answers: {
            LOW: 'Bad',
            MID: 'Okay',
            HIGH: 'Good',
        },
        type: QuestionType.SPEED,
        custom: true,
    },
    {
        questionId: 'question-3',
        question: 'How are you feeling?',
        answers: {
            LOW: 'Sad',
            MID: 'Okay',
            HIGH: 'Happy',
        },
        type: QuestionType.TECH,
        custom: true,
    },
    {
        questionId: 'question-4',
        question: 'Is this an optional question?',
        answers: {
            LOW: 'No',
            MID: 'Maybe',
            HIGH: 'Yes',
        },
        type: QuestionType.TEAM_HEALTH,
        custom: true,
        required: false,
    },
]
