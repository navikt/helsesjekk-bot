import React, { ReactElement } from 'react'
import Link from 'next/link'
import { CaretLeftIcon } from '@navikt/aksel-icons'

type Props = {
    href: string
}

function BackLink({ href }: Props): ReactElement {
    return (
        <Link href={href} className="flex gap-1 items-center transform -translate-y-full absolute">
            <CaretLeftIcon aria-hidden />
            Tilbake
        </Link>
    )
}

export default BackLink
