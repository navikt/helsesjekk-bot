import { createChartScene } from '@tanstack/charts/scene'
import { SceneNode } from '@tanstack/charts/types'
import { describe, expect, test } from 'vitest'

import { QuestionScorePerWeek, QuestionType } from '../../safe-types'

import { createQuestionChart, createScoreChart, ScoreRow } from './chart-definitions'

const size = { width: 800, height: 360 }

function flattenNodes(nodes: readonly SceneNode[]): SceneNode[] {
    return nodes.flatMap((node) => (node.kind === 'group' ? flattenNodes(node.children) : [node]))
}
const data: ScoreRow[] = [
    { timestamp: new Date('2026-01-05'), score: 3, answers: 20, TEAM_HEALTH: 4 },
    { timestamp: new Date('2026-01-12'), score: 4, answers: 40 },
    { timestamp: new Date('2026-01-19'), score: 2, answers: 10, TEAM_HEALTH: 2 },
]

describe('score charts', () => {
    test('keeps scores on a fixed scale independent of answer counts', () => {
        const scene = createChartScene(createScoreChart(data, [{ key: 'score', label: 'Team score' }]), size)

        expect(scene.scales.y.domain).toEqual([0, 5])
        expect(scene.scales.answers.domain).toEqual([0, 40])
        expect(scene.points.filter((point) => point.markId === 'score').map((point) => point.yValue)).toEqual([3, 4, 2])
        expect(scene.points.filter((point) => point.markId === 'answers').map((point) => point.yValue)).toEqual([
            20, 40, 10,
        ])
    })

    test('leaves gaps for missing categories instead of treating them as zero', () => {
        const scene = createChartScene(
            createScoreChart(data, [{ key: QuestionType.TEAM_HEALTH, label: 'Teamhelse' }]),
            size,
        )

        expect(
            scene.points.filter((point) => point.markId === QuestionType.TEAM_HEALTH).map((point) => point.yValue),
        ).toEqual([4, 2])
        const segments = flattenNodes(scene.nodes).filter((node) => node.kind === 'polyline')
        expect(segments).toHaveLength(2)
    })

    test('renders empty and single-measurement charts with finite coordinates', () => {
        for (const rows of [[], [data[0]]]) {
            const scene = createChartScene(createScoreChart(rows, [{ key: 'score', label: 'Team score' }]), size)
            expect(scene.scales.y.domain).toEqual([0, 5])
            expect(scene.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
        }
    })
})

describe('question distributions', () => {
    const question: QuestionScorePerWeek = {
        question: {
            questionId: 'health',
            question: 'Hvordan har du det?',
            answers: { GOOD: 'Bra', MEDIUM: 'Middels', BAD: 'Dårlig' },
            isCurrent: true,
        },
        scoring: [
            { timestamp: data[0].timestamp, averageScore: 3, distribution: { GOOD: 6, MEDIUM: 3, BAD: 1 } },
            { timestamp: data[1].timestamp, averageScore: null, distribution: { GOOD: null, MEDIUM: null, BAD: null } },
            { timestamp: data[2].timestamp, averageScore: 3, distribution: { GOOD: 2, MEDIUM: 0, BAD: 2 } },
        ],
    }

    test('normalizes each measurement to 100% while retaining raw answer counts', () => {
        const scene = createChartScene(createQuestionChart(question), size)
        const firstWeek = scene.points.filter((point) => point.datum.timestamp === data[0].timestamp)
        const lastWeek = scene.points.filter((point) => point.datum.timestamp === data[2].timestamp)

        expect(scene.scales.y.domain).toEqual([0, 1])
        firstWeek.forEach((point, index) => expect(point.y2Value).toBeCloseTo([0.6, 0.9, 1][index]))
        expect(lastWeek.map((point) => point.y2Value)).toEqual([0.5, 0.5, 1])
        expect(firstWeek.map((point) => point.datum.count)).toEqual([6, 3, 1])
        expect(scene.points.some((point) => point.datum.timestamp === data[1].timestamp)).toBe(false)
        expect(scene.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
    })
})
