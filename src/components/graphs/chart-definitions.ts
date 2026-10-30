import { areaY } from '@tanstack/charts/area'
import { barY } from '@tanstack/charts/bar'
import { colorLegend, colorLegendItems } from '@tanstack/charts/legend'
import { lineY } from '@tanstack/charts/line'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { defineChart } from '@tanstack/charts/scene'
import { stack } from '@tanstack/charts/stack'
import { tooltip } from '@tanstack/charts/tooltip'
import { StaticChartDefinition } from '@tanstack/charts/types'

import { AnswerLevel, QuestionScorePerWeek, QuestionType } from '../../safe-types'
import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'

export type ScoreRow = {
    score: number
    timestamp: Date
    answers: number
} & Partial<Record<QuestionType, number>>

type ScoreSeries = {
    key: 'score' | QuestionType
    label: string
}

const scoreColors: Record<ScoreSeries['key'], string> = {
    score: '#0067c5',
    TEAM_HEALTH: '#8b4513',
    SECTION_HEALTH: '#de8f59',
    GROUP_HEALTH: '#cb5d13',
    TEMPERATURE: '#e00000',
    ME: '#ff740c',
    SURROUNDINGS: '#880004',
    SPEED: '#666633',
    TECH: '#800080',
    OTHER: '#ff8c00',
}

const answerColors: Record<AnswerLevel, string> = {
    GOOD: '#6b8e23',
    MEDIUM: '#ff8c00',
    BAD: '#b3000c',
}

function formatWeek(date: Date): string {
    return `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`
}

export function createScoreChart(
    data: ScoreRow[],
    series: ScoreSeries[],
): StaticChartDefinition<ScoreRow, Date, number, 'dom'> {
    return defineChart({
        marks: [
            barY(data, {
                id: 'answers',
                x: 'timestamp',
                y: 'answers',
                yScale: 'answers',
                color: () => 'Antall svar',
            }),
            ...series.map(({ key, label }) =>
                lineY(data, {
                    id: key,
                    x: 'timestamp',
                    y: (row) => row[key],
                    color: () => label,
                    strokeWidth: 2,
                    points: true,
                }),
            ),
        ],
        scales: {
            x: {
                scale: () => scaleBand<Date>().padding(0.25),
                axis: { ticks: { format: formatWeek } },
            },
            y: {
                scale: scaleLinear().domain([0, 5]),
                grid: true,
                axis: { label: 'Score', ticks: { values: [0, 1, 2, 3, 4, 5] } },
            },
            answers: {
                channel: 'y',
                side: 'right',
                scale: scaleLinear().domain([0, Math.max(1, ...data.map((row) => row.answers))]),
                nice: true,
                axis: {
                    label: 'Antall svar',
                    ticks: { format: (value: number) => (Number.isInteger(value) ? String(value) : '') },
                },
            },
        },
        color: {
            domain: ['Antall svar', ...series.map(({ label }) => label)],
            range: ['#b0b0b0', ...series.map(({ key }) => scoreColors[key])],
            legend: colorLegend({ placement: 'bottom' }),
        },
        focus: 'group-x',
        tooltip: {
            use: tooltip,
            content: (points) => {
                const row = points[0]?.datum
                return {
                    title: row ? formatWeek(row.timestamp) : undefined,
                    rows: row
                        ? [
                              ...series.flatMap(({ key, label }) => {
                                  const value = row[key]
                                  return value == null
                                      ? []
                                      : [
                                            {
                                                label: `${scoreToEmoji(value)} ${label}`,
                                                value: value.toFixed(2),
                                                color: scoreColors[key],
                                            },
                                        ]
                              }),
                              { label: 'Antall svar', value: String(row.answers), color: '#b0b0b0' },
                          ]
                        : [],
                }
            },
        },
    })
}

export type AskedCountRow = {
    timestamp: Date
    count: number
}

export function createAskedCountChart(
    data: AskedCountRow[],
): StaticChartDefinition<AskedCountRow, Date, number, 'dom'> {
    return defineChart({
        marks: [
            barY(data, {
                id: 'asked',
                x: 'timestamp',
                y: 'count',
                color: () => 'Antall helsesjekker',
            }),
        ],
        scales: {
            x: {
                scale: () => scaleBand<Date>().padding(0.25),
                axis: { ticks: { format: formatWeek } },
            },
            y: {
                scale: scaleLinear().domain([0, Math.max(1, ...data.map((row) => row.count))]),
                nice: true,
                grid: true,
                axis: {
                    label: 'Antall helsesjekker',
                    ticks: { format: (value: number) => (Number.isInteger(value) ? String(value) : '') },
                },
            },
        },
        color: {
            domain: ['Antall helsesjekker'],
            range: ['#0067c5'],
        },
        focus: 'group-x',
        tooltip: {
            use: tooltip,
            content: (points) => {
                const row = points[0]?.datum
                return {
                    title: row ? formatWeek(row.timestamp) : undefined,
                    rows: row ? [{ label: 'Antall helsesjekker', value: String(row.count), color: '#0067c5' }] : [],
                }
            },
        },
    })
}

type QuestionRow = {
    timestamp: Date
    level: AnswerLevel
    count: number | null
}

export function createQuestionChart({
    question,
    scoring,
}: QuestionScorePerWeek): StaticChartDefinition<QuestionRow, Date, number, 'dom'> {
    const levels = Object.values(AnswerLevel)
    const rows = scoring.flatMap((row) =>
        levels.map((level) => ({
            timestamp: row.timestamp,
            level,
            count: row.distribution[level],
        })),
    )

    return defineChart({
        marks: [
            areaY(rows, {
                x: 'timestamp',
                y: 'count',
                z: 'level',
                layout: stack({ offset: 'normalize', order: levels }),
                fillOpacity: 0.65,
            }),
        ],
        scales: {
            x: {
                scale: () => scalePoint<Date>().padding(0.5),
                axis: { ticks: { format: formatWeek } },
            },
            y: {
                scale: scaleLinear().domain([0, 1]),
                grid: true,
                axis: { label: 'Andel svar', ticks: { format: (value: number) => `${Math.round(value * 100)} %` } },
            },
        },
        color: {
            domain: levels,
            range: levels.map((level) => answerColors[level]),
            legend: colorLegend({
                placement: 'bottom',
                items: colorLegendItems<AnswerLevel>({ label: { format: (level) => question.answers[level] } }),
            }),
        },
        focus: 'group-x',
        tooltip: {
            use: tooltip,
            content: (points) => ({
                title: points[0] ? formatWeek(points[0].datum.timestamp) : undefined,
                rows: points.map(({ datum }) => ({
                    label: question.answers[datum.level],
                    value: String(datum.count ?? 0),
                    color: answerColors[datum.level],
                })),
            }),
        },
    })
}
