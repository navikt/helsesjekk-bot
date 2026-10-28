'use client'

import { Chart } from '@tanstack/charts/react'
import React, { ReactElement, useMemo } from 'react'

import { createScoreChart, ScoreRow } from './chart-definitions'

type Props = {
    data: ScoreRow[]
}

export function OverallScoreGraph({ data }: Props): ReactElement {
    const definition = useMemo(() => createScoreChart(data, [{ key: 'score', label: 'Team score' }]), [data])

    return <Chart definition={definition} height={360} ariaLabel="Teamets score og antall svar per uke" />
}
