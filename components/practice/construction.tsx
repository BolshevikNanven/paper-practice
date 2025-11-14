'use client'

import { ImageIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { MovableDivider } from '../common/movable-divider'
import ConstructionCreator, { ConstructionCreatorRef } from './construction-creator'
import { usePracticeStore } from '@/store/practice'

import ConstructionEditor from './construction-editor'
import { useMemo, useRef, useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '../ui/textarea'
import { UploadWrapper } from '../common/upload-wrapper'
import { SubjectSelector } from './subjects-selector'
import { deepClone } from '@/lib/utils'
import { ChunkData } from '@/store/interface'
import { ConstructionPreviewer } from './construction-previewer'

export function PracticeConstruction() {
    const constructing = usePracticeStore(s => s.constructing)
    const practiceData = usePracticeStore(s => s.selectingPracticeSetData!.set)

    const practice = useMemo(() => practiceData.find(it => it.id === constructing), [constructing, practiceData])

    // 创建chunks副本
    const initialChunks = useMemo(() => {
        if (practice && practice.chunks) {
            return deepClone(practice.chunks)
        }
        return []
    }, [practice])
    const [chunks, setChunks] = useState<ChunkData[]>(initialChunks)

    const [selectedChunkId, setSelectedChunkId] = useState<string>()
    const selectedChunk = useMemo(() => chunks.find(chunk => chunk.id === selectedChunkId), [selectedChunkId, chunks])

    const [previewerOpen, setPreviewerOpen] = useState(false)
    const [selectorOpen, setSelectorOpen] = useState(false)
    const creatorRef = useRef<ConstructionCreatorRef>(null)

    function handleSelectChunk(id: string) {
        setSelectedChunkId(id)
    }

    function updateSelectedChunk(updater: (chunk: ChunkData) => ChunkData) {
        if (!selectedChunkId) return
        setChunks(chunks => chunks.map(chunk => (chunk.id === selectedChunkId ? updater(chunk) : chunk)))
    }

    function handleChangeAnswerType(value: string) {
        updateSelectedChunk(chunk => ({
            ...chunk,
            answer: { type: value as 'pic' | 'text', value: '' },
        }))
    }

    function handleInputAnswerText(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const value = e.target.value
        updateSelectedChunk(chunk => ({
            ...chunk,
            answer: { type: 'text', value },
        }))
    }

    function handleSelectAnswerPic(files: FileList) {
        const file = files[0]
        const url = URL.createObjectURL(file)
        updateSelectedChunk(chunk => ({
            ...chunk,
            answer: { type: 'pic', value: url },
        }))
    }

    function handleSelectSubject(title: string) {
        const subjects: string[] = []
        let has = false
        selectedChunk?.subjects.forEach(subject => {
            if (subject !== title) {
                subjects.push(subject)
                return
            }
            has = true
        })

        if (!has) {
            subjects.push(title)
        }

        updateSelectedChunk(chunk => ({
            ...chunk,
            subjects,
        }))
    }

    function handleDeleteSubject(title: string) {
        updateSelectedChunk(chunk => ({
            ...chunk,
            subjects: chunk.subjects.filter(it => it !== title),
        }))
    }

    async function handlePreview() {
        await creatorRef.current?.cropRectsToBlobs()

        setPreviewerOpen(true)
    }

    function handleSave(title: string) {}

    return (
        <div className='flex flex-1 overflow-hidden'>
            <div className='flex flex-1 flex-col gap-4'>
                {typeof constructing === 'string' ? (
                    <ConstructionEditor
                        title={practice!.title}
                        chunks={chunks}
                        selectedChunk={selectedChunk}
                        onSelect={handleSelectChunk}
                    />
                ) : (
                    <ConstructionCreator
                        ref={creatorRef}
                        chunks={chunks}
                        onChange={setChunks}
                        selectedChunk={selectedChunk}
                        onSelect={handleSelectChunk}
                    />
                )}
            </div>
            <MovableDivider />
            <div className='flex w-[380px] flex-col'>
                <header className='mb-2 flex h-10 items-center px-4'>
                    <h3 className='mr-auto font-bold'>预览</h3>
                </header>
                <span className='mx-4 mb-2 h-px bg-border' />
                <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-2'>
                    {selectedChunk && (
                        <>
                            <div className='flex flex-col gap-1'>
                                <h4 className='text-sm'>标签：</h4>
                                <div className='flex flex-wrap gap-2'>
                                    <Button size='sm' className='self-baseline' onClick={() => setSelectorOpen(true)}>
                                        选择标签
                                    </Button>
                                    {selectedChunk.subjects.map(subject => (
                                        <div
                                            key={subject}
                                            className='group relative flex h-8 cursor-pointer items-center rounded-full bg-muted px-3 text-sm select-none'
                                        >
                                            <span
                                                onClick={() => handleDeleteSubject(subject)}
                                                className='absolute inset-0 hidden rounded-full bg-muted text-red-600 group-hover:flex'
                                            >
                                                <TrashIcon size={18} className='m-auto' />
                                            </span>
                                            {subject}
                                        </div>
                                    ))}
                                </div>

                                <SubjectSelector
                                    open={selectorOpen}
                                    selectedSubjects={selectedChunk.subjects}
                                    onOpenChange={setSelectorOpen}
                                    onSelect={handleSelectSubject}
                                />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <h4 className='text-sm'>详解：</h4>
                                <div className='flex items-center justify-between gap-2'>
                                    <Select value={selectedChunk.answer?.type || 'text'} onValueChange={handleChangeAnswerType}>
                                        <SelectTrigger className='bg-card'>
                                            <SelectValue placeholder='选择详解的形式' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='pic'>图片形式</SelectItem>
                                            <SelectItem value='text'>文字形式</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {selectedChunk.answer?.type === 'pic' && (
                                        <UploadWrapper onFileSelect={handleSelectAnswerPic}>
                                            <Button variant='ghost' size='sm' className='h-9'>
                                                <ImageIcon size={18} /> 选择图片
                                            </Button>
                                        </UploadWrapper>
                                    )}
                                </div>

                                {selectedChunk.answer?.type === 'pic' ? (
                                    <div className='overflow-hidden rounded-md border bg-card'>
                                        {selectedChunk.answer.value && <img src={selectedChunk.answer.value} alt='answer' />}
                                    </div>
                                ) : (
                                    <Textarea
                                        value={selectedChunk.answer?.value as string}
                                        onChange={handleInputAnswerText}
                                        placeholder='在此输入详解'
                                        className='min-h-24 bg-card'
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
                <footer className='my-4 flex h-10 flex-row-reverse items-center gap-4 px-4'>
                    <ConstructionPreviewer
                        open={previewerOpen}
                        onOpenChange={setPreviewerOpen}
                        chunks={chunks}
                        onConfirm={handleSave}
                    >
                        <Button variant='primary' onClick={handlePreview}>
                            预览并保存
                        </Button>
                    </ConstructionPreviewer>
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
