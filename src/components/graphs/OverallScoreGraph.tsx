'use client'

import React, { ReactElement } from 'react'
import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'

import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'

type Props = {
    data: {
        score: number
        timestamp: Date
    }[]
}

function OverallScoreGraph({ data }: Props): ReactElement {
    return (
        <ResponsiveContainer width="100%" aspect={2}>
            <ComposedChart data={data}>
                <XAxis
                    dataKey="timestamp"
                    padding={{ left: 30, right: 30 }}
                    angle={10}
                    fontSize={12}
                    tickFormatter={(date: Date, index): string =>
                        index % 2 === 0 ? '' : `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`
                    }
                />
                <YAxis yAxisId="left" domain={[0, 5]} tickCount={6} />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    type="number"
                    dataKey="answers"
                    unit=" svar"
                />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar
                    yAxisId="right"
                    fill="lightgray"
                    type="monotone"
                    dataKey="answers"
                    isAnimationActive={false}
                    label={{
                        position: 'insideBottom',
                        angle: 0,
                        fill: 'white',
                        offset: 25,
                    }}
                />
                <Tooltip content={CustomTooltip} />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="score"
                    stroke="rgb(0, 103, 197, 0.5)"
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={CustomDot}
                />
                <Legend formatter={(value) => (value === 'answers' ? 'Antall svar' : 'Team score')} />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

function CustomTooltip({
    payload,
    active,
}: {
    payload: { payload: { score: number; timestamp: Date } }[]
    active: boolean
}): ReactElement {
    if (!active && payload.length === 0) return null

    const [first] = payload
    return (
        <div className="bg-white border border-border-default rounded p-2">
            <div className="flex gap-2">
                <span>{scoreToEmoji(first.payload.score)}</span>
                <span>{first.payload.score.toFixed(2)}</span>
            </div>
            Uke {getWeekNumber(first.payload.timestamp)}, {first.payload.timestamp.getFullYear()}
        </div>
    )
}

function CustomDot({ cx, cy, value }: { cx: number; cy: number; value: number }): ReactElement {
    return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red">
            <text textAnchor="middle" x="50%" y="13" fontSize="8">
                {scoreToEmoji(value)}
            </text>
        </svg>
    )
}

export default OverallScoreGraph
