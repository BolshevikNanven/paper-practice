'use client'

import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'
import { useRef } from 'react'

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
export function ConstructionRect({
    rect,
    className,
    parentElement,
    onChange,
    onClick,
    onStartDrag,
    onEndDrag,
    children,
}: Props) {
    const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
    const resizeStart = useRef<{ x: number; y: number; w: number; h: number; dir: string } | null>(null)

    function getParentRect() {
        return parentElement.current?.getBoundingClientRect()
    }

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
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
        if (resizeStart.current.dir === 'ne') {
            let newY = rect.y + dy
            let newH = Math.max(10, resizeStart.current.h - dy)
            let newW = Math.max(10, resizeStart.current.w + dx)
            if (newY < 0) {
                newH += newY
                newY = 0
            }
            newW = Math.min(newW, parent.width - rect.x)
            newH = Math.min(newH, parent.height - newY)
            newRect.y = newY
            newRect.w = newW
            newRect.h = newH
        }
        if (resizeStart.current.dir === 'sw') {
            let newX = rect.x + dx
            let newW = Math.max(10, resizeStart.current.w - dx)
            let newH = Math.max(10, resizeStart.current.h + dy)
            if (newX < 0) {
                newW += newX
                newX = 0
            }
            newW = Math.min(newW, parent.width - newX)
            newH = Math.min(newH, parent.height - rect.y)
            newRect.x = newX
            newRect.w = newW
            newRect.h = newH
        }
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
            className={cn('absolute cursor-pointer border-2 border-main bg-main/10', className)}
            style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
            }}
            onMouseDown={handleMouseDown}
            onClick={onClick}
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
            {/* 右上角拉手 */}
            <div
                className='absolute -top-1.5 -right-1.5 h-3 w-3 cursor-nesw-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'ne')}
            />
            {/* 左下角拉手 */}
            <div
                className='absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-nesw-resize hover:border-2 hover:border-main hover:bg-card'
                onMouseDown={e => handleResizeMouseDown(e, 'sw')}
            />
            {children}
        </div>
    )
}

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
