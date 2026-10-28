'use client'

import { Button } from '@navikt/ds-react'
import Link from 'next/link'
import React, { PropsWithChildren, ReactElement } from 'react'

type Props = {
    className?: string
    prefetch?: boolean
    href: string
}

export function LinkButton({ className, prefetch, children, href }: PropsWithChildren<Props>): ReactElement {
    return (
        <Button as={Link} href={href} className={className} prefetch={prefetch}>
            {children}
        </Button>
    )
}
