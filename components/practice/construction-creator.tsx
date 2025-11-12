'use client'

import { CropIcon, RobotIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { ButtonGroup } from '../common/button-group'
import React, { useRef, useState } from 'react'
import { ConstructionHeader } from './construction-header'
import { ConstructionRect } from './construction-rect'

export function ConstructionCreator() {
    const [isCropping, setIsCropping] = useState(false)
    const [cropRects, setCropRects] = useState<{ x: number; y: number; w: number; h: number }[]>([])
    const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const startPoint = useRef<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    function handleSwitchCrop() {
        setIsCropping(!isCropping)
        setIsDragging(false)
        setCurrentRect(null)
        startPoint.current = null
    }

    function handleMouseDown(e: React.MouseEvent) {
        if (!isCropping) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        setIsDragging(true)
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        startPoint.current = { x, y }
        setCurrentRect({ x, y, w: 0, h: 0 })
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isCropping || !isDragging || !startPoint.current) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const sx = startPoint.current.x
        const sy = startPoint.current.y
        setCurrentRect({
            x: Math.min(sx, x),
            y: Math.min(sy, y),
            w: Math.abs(x - sx),
            h: Math.abs(y - sy),
        })
    }

    function handleMouseUp() {
        if (!isCropping || !isDragging || !currentRect) return
        setIsDragging(false)
        startPoint.current = null
        if (currentRect.w > 0 && currentRect.h > 0) {
            setCropRects(prev => [...prev, currentRect])
        }
        setCurrentRect(null)
    }

    function handleRectChange(idx: number, newRect: { x: number; y: number; w: number; h: number }) {
        setCropRects(rects => rects.map((r, i) => (i === idx ? newRect : r)))
    }

    return (
        <>
            <ConstructionHeader title='创建新资料'>
                <ButtonGroup>
                    <Button onClick={handleSwitchCrop} variant={isCropping ? 'primary' : 'default'}>
                        <CropIcon size={18} />
                        {isCropping ? '完成框选' : '框选分片'}
                    </Button>
                    <Button>
                        <RobotIcon size={18} />
                        自动分片
                    </Button>
                </ButtonGroup>
                <Button>
                    <UploadSimpleIcon size={18} />
                    上传资料
                </Button>
            </ConstructionHeader>
            <div className='mr-2 flex-1 overflow-x-hidden overflow-y-auto pr-2 pb-12 pl-6 select-none'>
                <div
                    className='relative bg-card shadow-xl'
                    ref={containerRef}
                    style={{ userSelect: isCropping ? 'none' : undefined }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <img src='/test-practice.png' alt='' />
                    <img src='/test-practice.png' alt='' />
                    <img src='/test-practice.png' alt='' />
                    <img src='/test-practice.png' alt='' />
                    <img src='/test-practice.png' alt='' />
                    {/* 渲染所有已选框 */}
                    {cropRects.map((rect, idx) => (
                        <ConstructionRect
                            key={idx}
                            parentElement={containerRef}
                            rect={rect}
                            onChange={newRect => handleRectChange(idx, newRect)}
                        />
                    ))}
                    {isCropping && <div className='absolute inset-0 cursor-cell bg-black/20'></div>}
                    {/* 渲染当前正在框选的选框 */}
                    {currentRect && (
                        <div
                            className='absolute border-2 border-main/80 bg-main/10'
                            style={{
                                left: currentRect.x,
                                top: currentRect.y,
                                width: currentRect.w,
                                height: currentRect.h,
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
