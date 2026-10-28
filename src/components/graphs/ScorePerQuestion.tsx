'use client'

import { Heading } from '@navikt/ds-react'
import { Chart } from '@tanstack/charts/react'
import React, { ReactElement, useMemo } from 'react'

import { QuestionScorePerWeek } from '../../safe-types'

import { createQuestionChart } from './chart-definitions'

type Props = QuestionScorePerWeek

export function ScorePerQuestion({ question, scoring }: Props): ReactElement {
    const definition = useMemo(() => createQuestionChart({ question, scoring }), [question, scoring])

    return (
        <div className="w-full">
            <Heading size="small" level="4">
                {question.question}
            </Heading>
            <Chart definition={definition} height={320} ariaLabel={`Svarfordeling per uke: ${question.question}`} />
        </div>
    )
}
