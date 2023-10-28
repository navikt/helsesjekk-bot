'use client'

import React, { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'

import { Button } from 'aksel-client'

type Props = {
    className?: string
    href: string
}

function LinkButton({ className, children, href }: PropsWithChildren<Props>): ReactElement {
    return (
        <Button as={Link} href={href} className={className}>
            {children}
        </Button>
    )
}

export default LinkButton
