'use client'

import { Chart } from '@tanstack/charts/react'
import React, { ReactElement, useMemo } from 'react'

import { AskedCountRow, createAskedCountChart } from './chart-definitions'

type Props = {
    data: AskedCountRow[]
}

export function GlobalAskedCountGraph({ data }: Props): ReactElement {
    const definition = useMemo(() => createAskedCountChart(data), [data])

    return (
        <div className="w-full">
            <Chart definition={definition} height={320} ariaLabel="Antall helsesjekker for hele Nav per uke" />
        </div>
    )
}
