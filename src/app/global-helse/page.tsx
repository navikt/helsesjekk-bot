import React, { ReactElement, Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { Metadata } from 'next'
import { Heading, Skeleton } from '@navikt/ds-react'

import BackLink from '../../components/core/BackLink'
import { getGlobalScoreTimeline } from '../../db/score'
import GlobalScoreGraph from '../../components/graphs/GlobalScoreGraph'

export const metadata: Metadata = {
    title: 'Helsesjekk | Helse i NAV',
    description: 'Graf over helsen i hele NAV',
}

function Page(): ReactElement {
    return (
        <div>
            <BackLink href="/" />
            <Heading size="large">Helse hele NAV</Heading>
            <Suspense
                fallback={
                    <div className="w-full aspect-video">
                        <Heading size="medium" level="3">
                            Samlet score for alle aktive team
                        </Heading>
                        <Skeleton height="100%" width="100%" variant="rounded" />
                    </div>
                }
            >
                <GlobalGraph />
            </Suspense>
        </div>
    )
}

async function GlobalGraph(): Promise<ReactElement> {
    noStore()

    const globalScore = await getGlobalScoreTimeline()

    return (
        <div>
            <Heading size="medium" level="3">
                Samlet score for alle aktive team
            </Heading>
            <div className="mt-4">
                <GlobalScoreGraph data={globalScore} />
            </div>
        </div>
    )
}

export default Page
