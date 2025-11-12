'use client'

import { useRef } from 'react'

interface Props {
    rect: { x: number; y: number; w: number; h: number }
    onChange: (newRect: { x: number; y: number; w: number; h: number }) => void
    parentElement: React.RefObject<HTMLDivElement | null>
    onStartDrag?: () => void
    onEndDrag?: () => void
}
export function ConstructionRect({ rect, onChange, parentElement, onStartDrag, onEndDrag }: Props) {
    const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
    const resizeStart = useRef<{ x: number; y: number; w: number; h: number; dir: string } | null>(null)

    function getParentRect() {
        return parentElement.current?.getBoundingClientRect()
    }

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: rect.x,
            offsetY: rect.y,
        }
        document.addEventListener('mousemove', handleDrag)
        document.addEventListener('mouseup', handleDragEnd)
        onStartDrag?.()
    }

    function handleDrag(e: MouseEvent) {
        if (!dragStart.current) return
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        const parent = getParentRect()
        if (!parent) return

        let newX = dragStart.current.offsetX + dx
        let newY = dragStart.current.offsetY + dy

        // 限制在父容器范围内
        newX = Math.max(0, Math.min(newX, parent.width - rect.w))
        newY = Math.max(0, Math.min(newY, parent.height - rect.h))

        onChange({
            ...rect,
            x: newX,
            y: newY,
        })
    }

    function handleDragEnd() {
        dragStart.current = null
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
        onEndDrag?.()
    }

    function handleResizeMouseDown(e: React.MouseEvent, dir: string) {
        e.stopPropagation()
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            w: rect.w,
            h: rect.h,
            dir,
        }
        document.addEventListener('mousemove', handleResize)
        document.addEventListener('mouseup', handleResizeEnd)
        onStartDrag?.()
    }

    function handleResize(e: MouseEvent) {
        if (!resizeStart.current) return
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        const parent = getParentRect()
        if (!parent) return
        const newRect = { ...rect }

        if (resizeStart.current.dir === 'se') {
            newRect.w = Math.max(10, Math.min(resizeStart.current.w + dx, parent.width - rect.x))
            newRect.h = Math.max(10, Math.min(resizeStart.current.h + dy, parent.height - rect.y))
        }
        if (resizeStart.current.dir === 'nw') {
            let newX = rect.x + dx
            let newY = rect.y + dy
            let newW = Math.max(10, resizeStart.current.w - dx)
            let newH = Math.max(10, resizeStart.current.h - dy)
            // 限制左上角不能超出
            if (newX < 0) {
                newW += newX
                newX = 0
            }
            if (newY < 0) {
                newH += newY
                newY = 0
            }
            newW = Math.min(newW, parent.width - newX)
            newH = Math.min(newH, parent.height - newY)
            newRect.x = newX
            newRect.y = newY
            newRect.w = newW
            newRect.h = newH
        }
        // 可扩展其他方向
        onChange(newRect)
    }

    function handleResizeEnd() {
        resizeStart.current = null
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', handleResizeEnd)
        onEndDrag?.()
    }

    return (
        <div
            className='absolute border-2 border-main bg-main/10'
            style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                cursor: 'move',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* 右下角拉手 */}
            <div
                className='absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-nwse-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'se')}
            />
            {/* 左上角拉手 */}
            <div
                className='absolute -top-1.5 -left-1.5 h-3 w-3 cursor-nwse-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'nw')}
            />
        </div>
    )
}
