'use client'

import { Link as AkselLink } from '@navikt/ds-react'
import Link from 'next/link'
import React, { PropsWithChildren, ReactElement } from 'react'

export function AkselNextLink({
    children,
    href,
    className,
}: PropsWithChildren<{ href: string; className?: string }>): ReactElement {
    return (
        <AkselLink as={Link} href={href} className={className}>
            {children}
        </AkselLink>
    )
}
