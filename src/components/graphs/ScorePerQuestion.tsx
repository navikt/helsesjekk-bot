'use client'

import * as R from 'remeda'
import React, { ReactElement, useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Detail, Heading } from 'aksel-server'

import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'
import { AnswerLevel, QuestionScorePerWeek } from '../../safe-types'

type Props = QuestionScorePerWeek

const toPercent = (decimal: number, fixed = 0): string => `${(decimal * 100).toFixed(fixed)}%`

function ScorePerQuestion(props: Props): ReactElement {
    const { question, scoring } = props

    const CustomTooltip = useMemo(() => createCustomTooltip(), [scoring])
    return (
        <div className="w-full aspect-video relative">
            {question && (
                <Heading size="small" level="4">
                    {question.question}
                </Heading>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scoring} stackOffset={'expand'}>
                    <XAxis
                        dataKey="timestamp"
                        angle={10}
                        fontSize={12}
                        tickFormatter={(date: Date, index): string =>
                            index % 2 === 0 ? '' : `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`
                        }
                    />
                    <YAxis domain={[0, 5]} tickCount={6} />
                    <YAxis yAxisId={'antall'} orientation={'right'} hide={true} tickFormatter={toPercent} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey={`averageScore`}
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={({ key, ...rest }) => <CustomDot key={key} {...rest} />}
                    />

                    {Object.keys(AnswerLevel).map((level) => (
                        <Area
                            key={level}
                            type="monotone"
                            yAxisId={'antall'}
                            dataKey={`distribution.${level}`}
                            stackId={1}
                            stroke={colorMap[level]}
                            fill={colorMap[level]}
                            isAnimationActive={false}
                        />
                    ))}

                    <Legend
                        layout={'vertical'}
                        iconType={'circle'}
                        formatter={(value) => {
                            switch (value) {
                                case 'distribution.GOOD':
                                    return question.answers[AnswerLevel.GOOD]
                                case 'distribution.MEDIUM':
                                    return question.answers[AnswerLevel.MEDIUM]
                                case 'distribution.BAD':
                                    return question.answers[AnswerLevel.BAD]
                                case 'averageScore':
                                    return 'Gjennomsnitt'
                            }
                        }}
                    />
                    <Tooltip content={CustomTooltip} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

const colorMap: Record<AnswerLevel, string> = {
    GOOD: 'rgba(107, 142, 35, 0.65)',
    MEDIUM: 'rgba(255, 140, 0, 0.65)',
    BAD: 'rgba(179, 0, 12, 0.65)',
}

type CustomTooltipProps = {
    payload: {
        stroke: string
        dataKey: string
        payload: { timestamp: Date } & Record<number, { id: string; score: number }>
    }[]
    active: boolean
}

function createCustomTooltip(): (props: CustomTooltipProps) => ReactElement {
    return function CustomTooltip({ payload, active }: CustomTooltipProps): ReactElement {
        if (!active && payload.length === 0) return null
        const [first] = payload
        const relevantValues = R.pipe(
            payload,
            R.map((item) => R.pick(item, ['value', 'name'])),
            R.flatMap((item) => (R.isObject(item.value) ? Object.entries(item.value) : [{ [item.name]: item.value }])),
            R.flatMap(R.toPairs),
        )

        return (
            <div className="bg-white border border-border-default rounded p-2">
                <Detail>
                    Uke {getWeekNumber(first.payload.timestamp)}, {first.payload.timestamp.getFullYear()}
                </Detail>
                {R.pipe(
                    relevantValues,
                    R.map(([key, value]) => {
                        const dist = key.split('.')
                        const color = dist ? colorMap[dist[1] as AnswerLevel] : 'black'
                        return (
                            <div key={key}>
                                <div className="flex gap-2">
                                    <span style={{ color }}>
                                        <ScoreToDescription name={key} />
                                    </span>
                                    <span>{Number.isInteger(value) ? value : value.toFixed(2)}</span>
                                </div>
                            </div>
                        )
                    }),
                )}
            </div>
        )
    }
}

function ScoreToDescription({ name }: { name: string }): string {
    switch (name) {
        case 'averageScore':
            return 'Gjennomsnitt'
        case 'distribution.GOOD':
            return 'Good'
        case 'distribution.MEDIUM':
            return 'Medium'
        case 'distribution.BAD':
            return 'Bad'
    }
}

function CustomDot({ cx, cy, value }: { cx: number; cy: number; value: number }): ReactElement {
    if (value == null) return null

    return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red">
            <text textAnchor="middle" x="50%" y="13" fontSize="8">
                {scoreToEmoji(value)}
            </text>
        </svg>
    )
}

export default ScorePerQuestion
