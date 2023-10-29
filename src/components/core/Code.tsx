import React, { PropsWithChildren, ReactElement } from 'react'

function Code({ children }: PropsWithChildren): ReactElement {
    return <code className="text-sm bg-gray-100 rounded p-1">{children}</code>
}

export default Code
