'use client'

import { LinkPanel as AkselLinkPanel, LinkPanelProps } from '@navikt/ds-react'
import React, { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'

export function AkselNextLinkPanel({
    children,
    href,
    prefetch,
    ...rest
}: PropsWithChildren<
    { href: string; prefetch?: boolean } & Pick<LinkPanelProps, 'border' | 'className'>
>): ReactElement {
    return (
        <AkselLinkPanel as={Link} href={href} prefetch={prefetch} {...rest}>
            {children}
        </AkselLinkPanel>
    )
}
