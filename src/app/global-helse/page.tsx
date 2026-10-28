import { Heading, Skeleton } from '@navikt/ds-react'
import { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import React, { ReactElement, Suspense } from 'react'

import { BackLink } from '../../components/core/BackLink'
import { GlobalScoreGraph } from '../../components/graphs/GlobalScoreGraph'
import { getGlobalScoreTimeline } from '../../db/score'

export const metadata: Metadata = {
    title: 'Helsesjekk | Helse i Nav',
    description: 'Graf over helsen i hele Nav',
}

function Page(): ReactElement {
    return (
        <div>
            <BackLink href="/" />
            <Heading size="large">Helse hele Nav</Heading>
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
                Score for hele Nav de siste 52 ukene
            </Heading>
            <div className="mt-4">
                <GlobalScoreGraph data={globalScore} />
            </div>
        </div>
    )
}

export default Page
