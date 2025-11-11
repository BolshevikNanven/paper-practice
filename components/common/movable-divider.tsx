'use client'

import { DotsSixVerticalIcon } from "@phosphor-icons/react"

export function MovableDivider() {
    return (
        <div className='relative w-1 cursor-e-resize bg-transparent px-px text-foreground transition-colors hover:bg-main'>
            <DotsSixVerticalIcon className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' size={20} />
        </div>
    )
}
