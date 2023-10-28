import React, { ReactElement } from 'react'
import { Metadata } from 'next'

import { Heading, BodyLong } from 'aksel-server'

export const metadata: Metadata = {
    title: 'Helsesjekk | Kom i gang',
    description: 'Kom i gang med helsesjekk-bot',
}

function Page(): ReactElement {
    return (
        <div>
            <Heading size="large">Kom i gang med helsesjekk-bot</Heading>
            <BodyLong>Kommer...</BodyLong>
        </div>
    )
}

export default Page
