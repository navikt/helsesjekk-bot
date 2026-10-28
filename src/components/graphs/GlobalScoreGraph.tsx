'use client'

import { Switch } from '@navikt/ds-react'
import { Chart } from '@tanstack/charts/react'
import React, { ReactElement, useMemo, useState } from 'react'

import { QuestionType } from '../../safe-types'
import { questionTypeToText } from '../../utils/asked'

import { createScoreChart, ScoreRow } from './chart-definitions'

type Props = {
    data: ScoreRow[]
}

export function GlobalScoreGraph({ data }: Props): ReactElement {
    const [samletScore, setSamletScore] = useState(true)
    const definition = useMemo(
        () =>
            createScoreChart(
                data,
                samletScore
                    ? [{ key: 'score', label: 'Samlet score' }]
                    : Object.values(QuestionType).map((key) => ({ key, label: questionTypeToText(key) })),
            ),
        [data, samletScore],
    )

    return (
        <div className="w-full">
            <Switch checked={samletScore} onChange={(e) => setSamletScore(e.target.checked)}>
                Samlet score
            </Switch>
            <Chart definition={definition} height={420} ariaLabel="Score og antall svar for hele Nav per uke" />
        </div>
    )
}
