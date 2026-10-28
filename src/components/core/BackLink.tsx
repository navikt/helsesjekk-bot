import { CaretLeftIcon } from '@navikt/aksel-icons'
import Link from 'next/link'
import React, { ReactElement } from 'react'

type Props = {
    href: string
}

export function BackLink({ href }: Props): ReactElement {
    return (
        <Link href={href} className="flex gap-1 items-center transform -translate-y-full absolute">
            <CaretLeftIcon aria-hidden />
            Tilbake
        </Link>
    )
}
