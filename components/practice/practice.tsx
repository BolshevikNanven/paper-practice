'use client'

import { usePracticeStore } from '@/store/practice'
import { cn } from '@/lib/utils'
import { MouseEvent } from 'react'
import { PracticeData } from '@/store/interface'

interface Props {
    data: PracticeData
}
export function Practice({ data }: Props) {
    const { openPlayground, switchConstruction } = usePracticeStore(s => s.actions)
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const editing = usePracticeStore(s => s.editing)

    function handleClickPractice() {
        if (editing) {
            switchConstruction(data.id)
        } else {
            openPlayground({ type: 'practice', practice: data.id })
        }
    }

    function handleClickChunk(e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, chunk: string) {
        if (editing) {
            return
        }
        e.stopPropagation()

        openPlayground({
            type: 'chunk',
            practice: data.id,
            chunk,
        })
    }

    return (
        <div
            onClick={handleClickPractice}
            className='flex h-fit cursor-pointer flex-col px-2 pb-6 transition-all hover:bg-accent'
        >
            <div className='mb-2 flex h-10 items-center gap-2'>
                <h3 className='m-auto font-bold'>{data.title}</h3>
            </div>
            <div className='flex w-36 flex-1 flex-col bg-white shadow-lg select-none'>
                {data.chunks.map((chunk, idx) => {
                    const active = chunk.subjects.some(sub => sub === selectedSubject)
                    return (
                        <div
                            key={idx}
                            onClick={active ? e => handleClickChunk(e, chunk.id) : undefined}
                            className={cn(
                                active && 'z-10 rounded-xs outline-3 outline-main transition-all',
                                active && !editing && 'cursor-zoom-in hover:z-20 hover:outline-offset-2',
                            )}
                        >
                            <img src={chunk.source} alt={data.title + idx} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
