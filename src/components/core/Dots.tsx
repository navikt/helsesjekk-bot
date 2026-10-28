import React, { ReactElement } from 'react'

export function PingDot(): ReactElement {
    return (
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ax-success-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-ax-success-600"></span>
        </span>
    )
}

export function InactiveDot(): ReactElement {
    return (
        <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-ax-danger-400"></span>
        </span>
    )
}
