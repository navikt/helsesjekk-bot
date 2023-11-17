'use client'

import * as R from 'remeda'
import React, { ReactElement, useMemo } from 'react'
import { Bar, LineChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'

import { Detail } from 'aksel-server'

import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'
import { WeekWithQuestionScores } from '../../db/score'

type Props = {
    maxQuestions: number
    data:
        | ({
              timestamp: Date
          } & Record<number, { id: string; score: number }>)[]
        | WeekWithQuestionScores[]
    questions: { id: string; question: string }[]
}

function OverallScoreGraph({ maxQuestions, questions, data }: Props): ReactElement {
    const indexQuestionLookup: Record<number, string> = R.pipe(
        questions,
        R.map.indexed((it, index): [number, string] => [index, it.question]),
        R.fromPairs.strict,
    )
    const questionsMap = useMemo(() => R.indexBy(questions, (it) => it.id), [questions])
    const CustomTooltip = useMemo(() => createCustomTooltip(questionsMap), [questionsMap])

    return (
        <div className="w-full aspect-video relative">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis
                        dataKey="timestamp"
                        padding={{ left: 30, right: 30 }}
                        angle={10}
                        fontSize={12}
                        tickFormatter={(date: Date, index): string =>
                            index % 2 === 0 ? '' : `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`
                        }
                    />
                    <YAxis domain={[0, 5]} tickCount={6} />
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
                    {R.range(0, maxQuestions + 1).map((index) => (
                        <Line
                            key={index}
                            type="monotone"
                            dataKey={`${index}.score`}
                            stroke={index < 10 ? colorsLineIndex[index] : 'rgba(205, 92, 92, 0.5)'}
                            strokeWidth={2}
                            isAnimationActive={false}
                            dot={({ key, ...rest }) => <CustomDot key={key} {...rest} />}
                        />
                    ))}
                    <Legend formatter={(_value, _entry, index) => indexQuestionLookup[index]} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

const colorsLineIndex = {
    0: 'rgba(0, 103, 197, 0.65)',
    1: 'rgba(179, 0, 12, 0.65)',
    2: 'rgba(102, 102, 51, 0.65)',
    3: 'rgba(128, 0, 128, 0.65)',
    4: 'rgba(255, 140, 0, 0.65)',
    5: 'rgba(107, 142, 35, 0.65)',
    6: 'rgba(139, 69, 19, 0.65)',
    7: 'rgba(100, 149, 237, 0.65)',
    8: 'rgba(0, 100, 0, 0.65)',
    9: 'rgba(205, 92, 92, 0.65)',
}

type CustomTooltipProps = {
    payload: {
        stroke: string
        dataKey: string
        payload: { timestamp: Date } & Record<number, { id: string; score: number }>
    }[]
    active: boolean
}

function createCustomTooltip(
    questionsMap: Record<string, { id: string; question: string }>,
): (props: CustomTooltipProps) => ReactElement | null {
    return function CustomTooltip({ payload, active }: CustomTooltipProps): ReactElement | null {
        if (!active && payload.length === 0) return null

        const [first] = payload
        const relevantValues = R.toPairs
            .strict(first.payload)
            .filter(([, value]) => value != null)
            .filter((tuple) => tuple[0] !== 'timestamp') as [string, { id: string; score: number }][]

        const colors = R.fromPairs.strict(payload.map((it): [string, string] => [it.dataKey.split('.')[0], it.stroke]))

        return (
            <div className="bg-white border border-border-default rounded p-2">
                <Detail>
                    Uke {getWeekNumber(first.payload.timestamp)}, {first.payload.timestamp.getFullYear()}
                </Detail>
                {R.pipe(
                    relevantValues,
                    R.sortBy([([, value]) => value.score, 'desc']),
                    R.map(([key, value]) => {
                        if (value == null) return null

                        return (
                            <div key={key}>
                                <div className="flex gap-2">
                                    <span>{scoreToEmoji(value.score)}</span>
                                    <span style={{ color: colors[key] }}>{questionsMap[value.id]?.question}</span>
                                    <span>{value.score.toFixed(2)}</span>
                                </div>
                            </div>
                        )
                    }),
                )}
            </div>
        )
    }
}

function CustomDot({ cx, cy, value }: { cx: number; cy: number; value: number }): ReactElement | null {
    if (value == null) return null

    return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red">
            <text textAnchor="middle" x="50%" y="13" fontSize="8">
                {scoreToEmoji(value)}
            </text>
        </svg>
    )
}

export default OverallScoreGraph
