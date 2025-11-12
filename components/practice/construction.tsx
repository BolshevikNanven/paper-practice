'use client'

import { TrashIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { MovableDivider } from '../common/movable-divider'
import { ConstructionCreator } from './construction-creator'
import { usePracticeStore } from '@/store/practice'
import { ConstructionEditor } from './construction-editor'
import { useMemo, useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PracticeConstruction() {
    const constructing = usePracticeStore(s => s.constructing)

    const chunks = usePracticeStore(s => s.constructingChunks)
    const [selectedChunkId, setSelectedChunkId] = useState<string>()

    const selectedChunk = useMemo(() => chunks.find(it => it.id === selectedChunkId), [selectedChunkId, chunks])

    function handleSelectChunk(id: string) {
        setSelectedChunkId(id)
    }

    function handleChangeAnswerType(value: string) {}

    return (
        <div className='flex flex-1 overflow-hidden'>
            <div className='flex flex-1 flex-col gap-4'>
                {typeof constructing === 'string' ? (
                    <ConstructionEditor />
                ) : (
                    <ConstructionCreator selectedChunk={selectedChunkId} onSelect={handleSelectChunk} />
                )}
            </div>
            <MovableDivider />
            <div className='flex w-[380px] flex-col px-4'>
                <header className='mb-2 flex h-10 items-center'>
                    <h3 className='mr-auto font-bold'>预览</h3>
                </header>
                <span className='mb-2 h-px bg-border' />
                <div className='flex flex-1 flex-col gap-4 overflow-auto pt-2'>
                    {selectedChunk && (
                        <>
                            <div className='flex flex-col gap-1'>
                                <h4 className='text-sm'>分类：</h4>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <h4 className='text-sm'>详解：</h4>
                                <Select value={selectedChunk?.answer?.type || 'text'} onValueChange={handleChangeAnswerType}>
                                    <SelectTrigger className='w-full bg-card'>
                                        <SelectValue placeholder='选择详解的形式' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='pic'>图片形式</SelectItem>
                                        <SelectItem value='text'>文字形式</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
                <footer className='my-4 flex h-10 flex-row-reverse items-center gap-4'>
                    <Button variant='primary'>预览并保存</Button>
                    {typeof constructing === 'string' && (
                        <Button className='text-red-600'>
                            <TrashIcon size={18} />
                            删除资料
                        </Button>
                    )}
                </footer>
            </div>
        </div>
    )
}
