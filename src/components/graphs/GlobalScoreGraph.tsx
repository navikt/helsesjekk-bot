'use client'

import * as R from 'remeda'
import React, { ReactElement, useMemo, useState } from 'react'
import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Switch } from '@navikt/ds-react'
import { Detail } from '@navikt/ds-react'

import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'
import { QuestionType } from '../../safe-types'
import { questionTypeToText } from '../../utils/asked'

type Props = {
    data: ({
        score: number
        timestamp: Date
    } & Partial<Record<QuestionType, number>>)[]
}

const colors = {
    score: 'rgba(0, 103, 197, 0.65)',
    [QuestionType.TEAM_HEALTH]: 'rgba(139, 69, 19, 0.65)',
    [QuestionType.SPEED]: 'rgba(102, 102, 51, 0.65)',
    [QuestionType.TECH]: 'rgba(128, 0, 128, 0.65)',
    [QuestionType.OTHER]: 'rgba(255, 140, 0, 0.65)',
}

function GlobalScoreGraph({ data }: Props): ReactElement {
    const [samletScore, setSamletScore] = useState(false)
    const CustomTooltip = useMemo(() => createCustomTooltip(samletScore), [samletScore])

    return (
        <div className="w-full aspect-video">
            <div className="ml-16">
                <Switch onChange={(e) => setSamletScore(e.target.checked)}>Samlet score</Switch>
            </div>
            <ResponsiveContainer width="100%" height="100%">
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
                    <YAxis yAxisId="right" orientation="right" type="number" dataKey="answers" fontSize={12} />
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
                            offset: 30,
                            fontSize: 12,
                        }}
                    />
                    {/* @ts-expect-error This typing is wack */}
                    <Tooltip content={CustomTooltip} />
                    {samletScore ? (
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="score"
                            stroke="rgb(0, 103, 197, 0.5)"
                            strokeWidth={2}
                            isAnimationActive={false}
                            dot={({ key, ...rest }) => <CustomDot key={key} {...rest} />}
                        />
                    ) : (
                        R.keys(QuestionType).map((questionType) => (
                            <Line
                                key={questionType}
                                yAxisId="left"
                                type="monotone"
                                dataKey={questionType}
                                stroke={colors[questionType]}
                                strokeWidth={2}
                                isAnimationActive={false}
                                dot={({ key, ...rest }) => <CustomDot key={key} {...rest} />}
                            />
                        ))
                    )}
                    <Legend
                        formatter={(value) => {
                            if (value === 'answers') return 'Antall svar'
                            else if (value === 'score') return 'Samlet score'
                            return questionTypeToText(value)
                        }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

type CustomTooltipProps = {
    payload: { payload: { score: number; timestamp: Date } & Record<QuestionType, number> }[]
    active: boolean
}

function createCustomTooltip(samletScore: boolean): (props: CustomTooltipProps) => ReactElement | null {
    return function CustomTooltip({ payload, active }: CustomTooltipProps): ReactElement | null {
        if (!active && payload.length === 0) return null

        const [first] = payload

        return (
            <div className="bg-white border border-border-default rounded p-2">
                <Detail>
                    Uke {getWeekNumber(first.payload.timestamp)}, {first.payload.timestamp.getFullYear()}
                </Detail>
                {samletScore ? (
                    <div className="flex gap-2">
                        <span>{scoreToEmoji(first.payload.score)}</span>
                        <span style={{ color: 'rgb(0, 103, 197, 0.5)' }}>Total</span>
                        <span>{first.payload.score.toFixed(2)}</span>
                    </div>
                ) : (
                    R.filter(
                        R.keys(QuestionType).map((questionType) =>
                            first.payload[questionType] != null ? (
                                <div key={questionType} className="flex gap-2">
                                    <span>{scoreToEmoji(first.payload[questionType])}</span>
                                    <span style={{ color: colors[questionType] }}>
                                        {questionTypeToText(questionType as QuestionType)}
                                    </span>
                                    <span>{first.payload[questionType].toFixed(2)}</span>
                                </div>
                            ) : null,
                        ),
                        R.isTruthy,
                    )
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

export default GlobalScoreGraph
