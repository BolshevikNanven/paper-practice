'use client'

import { memo } from 'react'
import { ConstructionHeader } from './construction-header'
import { ChunkData } from '@/store/interface'
import { cn } from '@/lib/utils'
import ImageRenderer from '../common/image-renderer'

interface Props {
    title: string
    chunks: ChunkData[]
    selectedChunk?: ChunkData
    onSelect: (id: string) => void
}
export default memo(function ConstructionEditor({ title, chunks, selectedChunk, onSelect }: Props) {
    return (
        <>
            <ConstructionHeader title={`编辑 - ${title}`}></ConstructionHeader>
            <div className='mr-2 flex-1 overflow-x-hidden overflow-y-auto pr-2 pb-12 pl-6 select-none'>
                <div className='relative bg-card shadow-xl'>
                    {chunks.map(chunk => (
                        <div key={chunk.id} className='group relative w-full'>
                            <ImageRenderer src={chunk.source} className='w-full' alt='chunk' />
                            <div
                                className={cn(
                                    'absolute inset-0 hidden cursor-pointer border-2 border-main group-hover:block',
                                    selectedChunk?.id === chunk.id && 'block cursor-default bg-main/10',
                                )}
                                onClick={() => onSelect(chunk.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
})
