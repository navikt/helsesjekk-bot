import React, { ReactElement, Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'

import BackLink from '../../components/core/BackLink'
import { getGlobalScoreTimeline } from '../../db/score'
import GlobalScoreGraph from '../../components/graphs/GlobalScoreGraph'

import { Heading, Skeleton } from 'aksel-server'

function Page(): ReactElement {
    return (
        <div>
            <BackLink href="/" />
            <Heading size="large">Global helse i NAV</Heading>
            <Suspense
                fallback={
                    <div className="w-full aspect-video">
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
                Samlet score for alle team
            </Heading>
            <div className="mt-4">
                <GlobalScoreGraph data={globalScore} />
            </div>
        </div>
    )
}

export default Page
