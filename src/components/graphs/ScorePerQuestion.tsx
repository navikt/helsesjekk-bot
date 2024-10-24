'use client'

import * as R from 'remeda'
import React, { ReactElement } from 'react'
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Detail, Heading } from '@navikt/ds-react'
import { TooltipProps } from 'recharts/types/component/Tooltip'

import { getWeekNumber } from '../../utils/date'
import { scoreToEmoji } from '../../utils/score'
import { AnswerLevel, QuestionScorePerWeek } from '../../safe-types'
import { raise } from '../../utils/ts-utils'

type Props = QuestionScorePerWeek

const toPercent = (decimal: number, fixed = 0): string => `${(decimal * 100).toFixed(fixed)}%`

function ScorePerQuestion(props: Props): ReactElement {
    const { question, scoring } = props

    return (
        <div className="w-full aspect-video relative">
            {question && (
                <Heading size="small" level="4">
                    {question.question}
                </Heading>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scoring} stackOffset="expand">
                    <XAxis
                        dataKey="timestamp"
                        angle={10}
                        fontSize={12}
                        tickFormatter={(date: Date, index): string =>
                            index % 2 === 0 ? '' : `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`
                        }
                    />
                    <YAxis domain={[0, 5]} tickCount={6} />
                    <YAxis yAxisId="antall" orientation="right" hide={true} tickFormatter={toPercent} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="averageScore"
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={({ key, ...rest }) => <CustomDot key={key} {...rest} />}
                    />

                    {Object.keys(AnswerLevel).map((level) => (
                        <Area
                            key={level}
                            type="monotone"
                            yAxisId="antall"
                            dataKey={`distribution.${level}`}
                            stackId={1}
                            // @ts-expect-error TODO: improve typing
                            stroke={colorMap[level]}
                            // @ts-expect-error TODO: improve typing
                            fill={colorMap[level]}
                            isAnimationActive={false}
                        />
                    ))}

                    <Legend
                        layout="vertical"
                        iconType="circle"
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

type CustomTooltipPayload = QuestionScorePerWeek['scoring'][number]

function CustomTooltip({ payload, active }: TooltipProps<number, string>): ReactElement | null {
    if (!active || !payload || payload.length === 0) return null

    const relevantValues = R.pipe(
        payload,
        R.map((item) => R.pick(item, ['value', 'name'])),
        R.flatMap((item) => [{ [item.name ?? 'unknown']: item.value ?? 0 }]),
        R.flatMap(R.entries()),
    )
    const firstPayload: CustomTooltipPayload =
        R.first(payload)?.payload ?? raise('Should always have at least 1 payload here')

    if (!relevantValues.find(([key]) => key === 'averageScore')) {
        return (
            <div className="bg-white border border-border-default rounded p-2">
                <Detail>
                    Uke {getWeekNumber(firstPayload.timestamp)}, {firstPayload.timestamp.getFullYear()}
                </Detail>
                <div>Ikke nok svar denne uken</div>
            </div>
        )
    }

    return (
        <div className="bg-white border border-border-default rounded p-2">
            <Detail>
                Uke {getWeekNumber(firstPayload.timestamp)}, {firstPayload.timestamp.getFullYear()}
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

function ScoreToDescription({ name }: { name: string }): string {
    switch (name) {
        case 'averageScore':
            return 'Gjennomsnitt'
        case 'distribution.GOOD':
            return 'Bra'
        case 'distribution.MEDIUM':
            return 'Middels'
        case 'distribution.BAD':
            return 'Dårlig'
        default:
            console.error(`Unknown score type: ${name}`)
            return 'Ukjent'
    }
}

function CustomDot({ cx, cy, value }: { cx: number; cy: number; value: number }): ReactElement | null {
    if (value == null)
        return (
            <svg x={cx - 96 / 2} y="30%" width={96} height={48} fill="red">
                <text textAnchor="middle" x="50%" y="50%" fontSize="28">
                    ⚠️
                </text>
                <text textAnchor="middle" x="50%" y="78%" fontSize="12">
                    Mindre enn 3 svar
                </text>
            </svg>
        )

    return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red">
            <text textAnchor="middle" x="50%" y="13" fontSize="8">
                {scoreToEmoji(value)}
            </text>
        </svg>
    )
}

export default ScorePerQuestion
