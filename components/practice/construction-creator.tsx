'use client'

import { CropIcon, RobotIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { ButtonGroup } from '../common/button-group'
import React, { memo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { ConstructionHeader } from './construction-header'
import { ConstructionRect, cropSingleRect, ImageLayoutWithElement, Rect } from './construction-rect'
import { ChunkData } from '@/store/interface'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import { UploadWrapper } from '../common/upload-wrapper'

interface Props {
    chunks: ChunkData[]
    selectedChunk?: ChunkData
    onSelect: (id: string) => void
    onChange: (chunks: ChunkData[]) => void
}

export interface ConstructionCreatorRef {
    cropRectsToBlobs: () => Promise<void>
}

const ConstructionCreator = forwardRef<ConstructionCreatorRef, Props>(function ConstructionCreator(
    { chunks, selectedChunk, onSelect, onChange },
    ref,
) {
    const [papers, setPapers] = useState<string[]>([])

    const [isCropping, setIsCropping] = useState(false)
    const [cropRects, setCropRects] = useState<Rect[]>([])
    const [currentRect, setCurrentRect] = useState<Rect | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const startPoint = useRef<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        async cropRectsToBlobs() {
            if (!containerRef.current || !cropRects.length) {
                return
            }

            const imgElements = Array.from(containerRef.current.querySelectorAll('img'))

            // 获取每张图片渲染后的位置和大小
            const imageLayouts: ImageLayoutWithElement[] = imgElements.map(img => ({
                src: img.src,
                y: img.offsetTop,
                height: img.offsetHeight,
                width: img.offsetWidth,
                naturalHeight: img.naturalHeight,
                naturalWidth: img.naturalWidth,
                element: img, // 传递元素本身以便绘制
            }))

            // 2. 并行处理所有裁剪矩形
            const resultMap: Record<string, Blob> = {}
            await Promise.all(
                cropRects.map(async rect => {
                    const blob = await cropSingleRect(rect, imageLayouts)
                    if (blob) {
                        resultMap[rect.id] = blob
                    } else {
                        throw new Error('图片裁剪失败')
                    }
                }),
            )

            onChange(
                chunks.map(chunk => ({
                    ...chunk,
                    source: resultMap[chunk.id],
                })),
            )
        },
    }))

    function handleSwitchCrop() {
        setIsCropping(!isCropping)
        setIsDragging(false)
        setCurrentRect(null)
        startPoint.current = null
    }

    function handleCropStart(e: React.MouseEvent) {
        if (!isCropping) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        setIsDragging(true)
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        startPoint.current = { x, y }
        setCurrentRect({ id: nanoid(), x, y, w: 0, h: 0 })
    }

    function handleCropMove(e: React.MouseEvent) {
        if (!isCropping || !isDragging || !startPoint.current) return
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const sx = startPoint.current.x
        const sy = startPoint.current.y
        setCurrentRect(prev => ({
            id: prev!.id,
            x: Math.min(sx, x),
            y: Math.min(sy, y),
            w: Math.abs(x - sx),
            h: Math.abs(y - sy),
        }))
    }

    function handleCropDone() {
        if (!isCropping || !isDragging || !currentRect) return
        setIsDragging(false)
        startPoint.current = null
        if (currentRect.w > 0 && currentRect.h > 0) {
            setCropRects(prev => [...prev, currentRect])
            onChange([
                ...chunks,
                {
                    id: currentRect.id,
                    subjects: [],
                    source: '',
                },
            ])
        }
        setCurrentRect(null)
    }

    function handleRectChange(idx: number, newRect: Rect) {
        setCropRects(rects => rects.map((r, i) => (i === idx ? newRect : r)))
    }

    function handleDeleteRect(e: React.MouseEvent<HTMLButtonElement>, id: string) {
        e.stopPropagation()
        e.preventDefault()

        setCropRects(rects => rects.filter(r => r.id !== id))
        if (selectedChunk?.id === id) {
            onSelect('')
        }
        onChange(chunks.filter(chunk => chunk.id !== id))
    }

    function handleSelectPaper(files: FileList) {
        const urls: string[] = []

        for (const file of files) {
            urls.push(URL.createObjectURL(file))
        }

        setPapers(prev => [...prev, ...urls])
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
                <UploadWrapper onFileSelect={handleSelectPaper} multiple accept='image/*'>
                    <Button>
                        <UploadSimpleIcon size={18} />
                        上传资料
                    </Button>
                </UploadWrapper>
            </ConstructionHeader>
            <div className='mr-2 flex-1 overflow-x-hidden overflow-y-auto pr-2 pb-12 pl-6 select-none'>
                {papers.length === 0 && <div className='h-full w-full bg-card shadow-xl'></div>}
                <div
                    className='relative bg-card shadow-xl'
                    ref={containerRef}
                    style={{ userSelect: isCropping ? 'none' : undefined }}
                    onMouseDown={handleCropStart}
                    onMouseMove={handleCropMove}
                    onMouseUp={handleCropDone}
                >
                    {papers.map(url => (
                        <img key={url} src={url} className='w-full' alt='paper' />
                    ))}
                    {/* 渲染所有已选框 */}
                    {cropRects.map((rect, idx) => (
                        <ConstructionRect
                            key={idx}
                            className={cn(
                                'group transition-colors hover:bg-main/30',
                                selectedChunk?.id === rect.id && 'bg-main/30',
                            )}
                            parentElement={containerRef}
                            rect={rect}
                            onChange={newRect => handleRectChange(idx, newRect)}
                            onClick={() => onSelect(rect.id)}
                        >
                            <div className='absolute right-2 bottom-2 hidden group-hover:flex'>
                                <Button
                                    className='text-destructive'
                                    size='sm'
                                    variant='icon'
                                    onClick={e => handleDeleteRect(e, rect.id)}
                                >
                                    <TrashIcon size={18} />
                                </Button>
                            </div>
                        </ConstructionRect>
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
})

export default memo(ConstructionCreator)
