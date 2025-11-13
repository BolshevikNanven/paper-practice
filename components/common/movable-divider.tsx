'use client'

import { useRef } from 'react'
import { DotsSixVerticalIcon } from '@phosphor-icons/react'

interface MovableDividerProps {
    onMove?: (deltaX: number) => void
}

export function MovableDivider({ onMove }: MovableDividerProps) {
    const dragging = useRef(false)
    const lastX = useRef(0)

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        dragging.current = true
        lastX.current = e.clientX
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    function handleMouseMove(e: MouseEvent) {
        if (!dragging.current) return
        const deltaX = e.clientX - lastX.current
        lastX.current = e.clientX
        if (onMove) onMove(deltaX)
    }

    function handleMouseUp() {
        dragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    return (
        <div
            className='relative w-1 cursor-e-resize bg-transparent px-px text-foreground transition-colors select-none hover:bg-main'
            onMouseDown={handleMouseDown}
        >
            <DotsSixVerticalIcon className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' size={20} />
        </div>
    )
}
