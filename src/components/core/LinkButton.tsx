'use client'

import React, { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'
import { Button } from '@navikt/ds-react'

type Props = {
    className?: string
    prefetch?: boolean
    href: string
}

function LinkButton({ className, prefetch, children, href }: PropsWithChildren<Props>): ReactElement {
    return (
        <Button as={Link} href={href} className={className} prefetch={prefetch}>
            {children}
        </Button>
    )
}

export default LinkButton
