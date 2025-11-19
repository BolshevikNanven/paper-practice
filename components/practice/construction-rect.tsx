'use client'

import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'
import { memo, useEffect, useRef, useState } from 'react'

export interface Rect {
    id: string
    x: number
    y: number
    w: number
    h: number
}

interface Props {
    rect: Rect
    className?: ClassValue
    parentElement: React.RefObject<HTMLDivElement | null>
    onChange: (newRect: Rect) => void
    onClick?: () => void
    onStartDrag?: () => void
    onEndDrag?: () => void
    children?: React.ReactNode
}

export const ConstructionRect = memo(function ConstructionRect({
    rect,
    className,
    parentElement,
    onChange,
    onClick,
    onStartDrag,
    onEndDrag,
    children,
}: Props) {
    const [localRect, setLocalRect] = useState(rect)
    const processingRect = useRef(rect)

    const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
    const resizeStart = useRef<{
        x: number
        y: number
        w: number
        h: number
        x_pos: number
        y_pos: number
        dir: string
    } | null>(null)

    useEffect(() => {
        setLocalRect(rect)
        processingRect.current = rect
    }, [rect])

    function getParentRect() {
        return parentElement.current?.getBoundingClientRect()
    }

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        dragStart.current = { x: e.clientX, y: e.clientY, offsetX: localRect.x, offsetY: localRect.y }
        processingRect.current = localRect
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

        newX = Math.max(0, Math.min(newX, parent.width - processingRect.current.w))
        newY = Math.max(0, Math.min(newY, parent.height - processingRect.current.h))

        const nextRect = { ...processingRect.current, x: newX, y: newY }
        processingRect.current = nextRect
        setLocalRect(nextRect)
    }

    function handleDragEnd() {
        dragStart.current = null
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
        onEndDrag?.()
        onChange(processingRect.current)
    }

    function handleResizeMouseDown(e: React.MouseEvent, dir: string) {
        e.stopPropagation()
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            w: localRect.w,
            h: localRect.h,
            x_pos: localRect.x,
            y_pos: localRect.y,
            dir,
        }
        processingRect.current = localRect
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

        const start = resizeStart.current
        const nextRect = { ...processingRect.current }

        if (start.dir === 'se') {
            nextRect.w = Math.max(10, Math.min(start.w + dx, parent.width - start.x_pos))
            nextRect.h = Math.max(10, Math.min(start.h + dy, parent.height - start.y_pos))
        } else if (start.dir === 'nw') {
            let newX = start.x_pos + dx
            let newY = start.y_pos + dy
            let newW = Math.max(10, start.w - dx)
            let newH = Math.max(10, start.h - dy)

            if (newX < 0) {
                newW += newX
                newX = 0
            }
            if (newY < 0) {
                newH += newY
                newY = 0
            }

            const maxX = start.x_pos + start.w - 10
            const maxY = start.y_pos + start.h - 10

            if (newX > maxX) newX = maxX
            if (newY > maxY) newY = maxY

            nextRect.x = newX
            nextRect.y = newY
            nextRect.w = newW
            nextRect.h = newH
        } else if (start.dir === 'ne') {
            let newY = start.y_pos + dy
            let newH = Math.max(10, start.h - dy)
            const newW = Math.max(10, Math.min(start.w + dx, parent.width - start.x_pos))

            if (newY < 0) {
                newH += newY
                newY = 0
            }

            const maxY = start.y_pos + start.h - 10
            if (newY > maxY) newY = maxY

            nextRect.y = newY
            nextRect.w = newW
            nextRect.h = newH
        } else if (start.dir === 'sw') {
            let newX = start.x_pos + dx
            let newW = Math.max(10, start.w - dx)
            const newH = Math.max(10, Math.min(start.h + dy, parent.height - start.y_pos))

            if (newX < 0) {
                newW += newX
                newX = 0
            }

            const maxX = start.x_pos + start.w - 10
            if (newX > maxX) newX = maxX

            nextRect.x = newX
            nextRect.w = newW
            nextRect.h = newH
        }

        processingRect.current = nextRect
        setLocalRect(nextRect)
    }

    function handleResizeEnd() {
        resizeStart.current = null
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', handleResizeEnd)
        onEndDrag?.()
        onChange(processingRect.current)
    }

    return (
        <div
            className={cn('absolute cursor-pointer border-2 border-main bg-main/10', className)}
            style={{ left: localRect.x, top: localRect.y, width: localRect.w, height: localRect.h }}
            onMouseDown={handleMouseDown}
            onClick={onClick}
        >
            <div
                className='absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-nwse-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'se')}
            />
            <div
                className='absolute -top-1.5 -left-1.5 h-3 w-3 cursor-nwse-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'nw')}
            />
            <div
                className='absolute -top-1.5 -right-1.5 h-3 w-3 cursor-nesw-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'ne')}
            />
            <div
                className='absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-nesw-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'sw')}
            />
            {children}
        </div>
    )
})

export interface ImageLayoutWithElement {
    src: string
    y: number // 相对于容器的顶部偏移
    height: number
    width: number
    naturalHeight: number
    naturalWidth: number
    element: HTMLImageElement // 实际的 <img> 元素
}
/**
 * 从堆叠的图片中裁剪单个矩形区域。
 */
export async function cropSingleRect(rect: Rect, imageLayouts: ImageLayoutWithElement[]): Promise<Blob | null> {
    if (imageLayouts.length === 0) return null

    const refImg = imageLayouts[0]
    // 计算参考缩放比例
    const refScaleX = refImg.naturalWidth / refImg.width
    const refScaleY = refImg.naturalHeight / refImg.height

    const canvas = document.createElement('canvas')
    canvas.width = rect.w * refScaleX
    canvas.height = rect.h * refScaleY
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        console.error('无法从 canvas 获取 2D 上下文')
        return null
    }

    // 遍历每张图片，看它是否与 rect 重叠
    for (const imgLayout of imageLayouts) {
        const imgTop = imgLayout.y
        const imgBottom = imgLayout.y + imgLayout.height
        const imgLeft = 0
        const imgRight = imgLayout.width

        const rectTop = rect.y
        const rectBottom = rect.y + rect.h
        const rectLeft = rect.x
        const rectRight = rect.x + rect.w

        // 检查是否有交集
        const overlapsY = rectTop < imgBottom && rectBottom > imgTop
        const overlapsX = rectLeft < imgRight && rectRight > imgLeft

        if (overlapsX && overlapsY) {
            // 这张图片和 rect 重叠了。
            // 计算精确的相交区域。
            const intersectLeft = Math.max(rectLeft, imgLeft)
            const intersectTop = Math.max(rectTop, imgTop)
            const intersectRight = Math.min(rectRight, imgRight)
            const intersectBottom = Math.min(rectBottom, imgBottom)

            const intersectWidth = intersectRight - intersectLeft
            const intersectHeight = intersectBottom - intersectTop

            if (intersectWidth > 0 && intersectHeight > 0) {
                const imgScaleX = imgLayout.naturalWidth / imgLayout.width
                const imgScaleY = imgLayout.naturalHeight / imgLayout.height
                // (sX, sY, sW, sH) - 从源图片(原始尺寸)中截取的位置
                // 我们用“屏幕坐标”的偏移量 * 该图片的缩放比例
                const sX = (intersectLeft - imgLeft) * imgScaleX
                const sY = (intersectTop - imgTop) * imgScaleY
                const sW = intersectWidth * imgScaleX
                const sH = intersectHeight * imgScaleY

                // (dX, dY, dW, dH) - 绘制到目标 canvas(原始尺寸)上的位置
                // 我们用“屏幕坐标”的偏移量 * 画布的参考缩放比例
                const dX = (intersectLeft - rectLeft) * refScaleX
                const dY = (intersectTop - rectTop) * refScaleY
                const dW = intersectWidth * refScaleX
                const dH = intersectHeight * refScaleY

                try {
                    // 将图像的相交部分绘制到画布上
                    ctx.drawImage(
                        imgLayout.element,
                        sX,
                        sY,
                        sW,
                        sH, // 源矩形
                        dX,
                        dY,
                        dW,
                        dH, // 目标矩形
                    )
                } catch (e) {
                    console.error('绘制图像到 canvas 失败', e)
                    return null // 如果一张图片失败，我们就无法创建有效的裁剪。
                }
            }
        }
    }

    // 将填充好的 canvas 转换为 Blob
    return new Promise(resolve => {
        canvas.toBlob(blob => {
            resolve(blob)
        }, 'image/png')
    })
}
