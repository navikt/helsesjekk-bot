import React, { PropsWithChildren, ReactElement } from 'react'

export function Code({ children }: PropsWithChildren): ReactElement {
    return <code className="text-sm bg-ax-neutral-200 rounded-sm p-1">{children}</code>
}
