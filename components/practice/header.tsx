'use client'

import { HouseSimpleIcon, ListIcon, PlayIcon, PlusIcon, ShuffleAngularIcon, UserIcon, WrenchIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { useRouter } from 'next/navigation'
import { usePracticeStore } from '@/store/practice'

export function PracticeHeader() {
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const isEditing = usePracticeStore(s => s.editing)
    const isConstructing = usePracticeStore(s => s.constructing)

    const router = useRouter()

    const { switchEditMode, openPlayground, switchConstruction } = usePracticeStore(s => s.actions)

    function handleStartSubject() {
        if (selectedSubject) {
            openPlayground({ type: 'subject' })
        }
    }

    function handleStartRandom() {
        openPlayground({ type: 'random' })
    }

    return (
        <div className='flex items-center gap-4 p-4'>
            <Button variant='icon'>
                <ListIcon size={18} />
            </Button>
            <div className='flex items-center'>
                <Button variant='ghost' onClick={() => router.push('/')}>
                    <HouseSimpleIcon size={18} />
                </Button>
                <span className='mr-2'>/</span>
                <h1 className='text-sm'>考研数学历年真题</h1>
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
            <Button variant={isEditing ? 'primary' : 'default'} onClick={() => switchEditMode()}>
                <WrenchIcon size={18} />
                {isEditing ? '退出编辑' : '编辑模式'}
            </Button>
            <Button variant='icon'>
                <UserIcon size={18} />
            </Button>
        </div>
    )
}
