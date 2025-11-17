'use client'

import { HouseSimpleIcon, ListIcon, PlayIcon, PlusIcon, ShuffleAngularIcon, WrenchIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePracticeStore } from '@/store/practice'
import { usePlayground } from '@/hooks/use-playground'
import { useGeneralStore } from '@/store/general'

export function PracticeHeader() {
    const selectingPracticeSetData = usePracticeStore(s => s.selectingPracticeSetData!)
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const isEditing = usePracticeStore(s => s.editing)
    const isConstructing = usePracticeStore(s => s.constructing)

    const router = useRouter()
    const searchParams = useSearchParams()

    const { switchEditMode, switchConstruction } = usePracticeStore(s => s.actions)
    const { switchOverviewShown } = useGeneralStore(s => s.actions)
    const openPlayground = usePlayground()

    function handleStartSubject() {
        if (selectedSubject) {
            openPlayground({ type: 'subject' })
        }
    }

    function handleStartRandom() {
        openPlayground({ type: 'random' })
    }

    function handleOverview() {
        switchOverviewShown()
    }

    return (
        <div className='flex items-center gap-4 p-4'>
            <Button variant='icon' onClick={handleOverview}>
                <ListIcon size={18} />
            </Button>
            <div className='flex items-center'>
                <Button variant='ghost' onClick={() => router.push('/')}>
                    <HouseSimpleIcon size={18} />
                </Button>
                <span className='mr-2'>/</span>
                <h1 className='text-sm'>{selectingPracticeSetData.title}</h1>
            </div>
            <span className='flex-1' />
            {!isEditing && (
                <>
                    <Button variant='primary' disabled={!selectedSubject} onClick={handleStartSubject}>
                        <PlayIcon size={18} weight='bold' />
                        开始专题
                    </Button>
                    <Button onClick={handleStartRandom}>
                        <ShuffleAngularIcon size={18} />
                        随机刷题
                    </Button>
                </>
            )}
            {isEditing && !isConstructing && (
                <Button onClick={() => switchConstruction(true)}>
                    <PlusIcon />
                    新建资料
                </Button>
            )}
            {!searchParams.has('public') && (
                <Button variant={isEditing ? 'primary' : 'default'} onClick={() => switchEditMode()}>
                    <WrenchIcon size={18} />
                    {isEditing ? '退出编辑' : '编辑模式'}
                </Button>
            )}
        </div>
    )
}
