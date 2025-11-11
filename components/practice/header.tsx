'use client'

import { HouseSimpleIcon, ListIcon, PlayIcon, ShuffleAngularIcon, UserIcon, WrenchIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { useStore } from '@/store'

export function PracticeHeader() {
    const selectedSubject = useStore(state => state.practiceSubjectSelected)
    const isEditing = useStore(state => state.practiceEditing)

    const { switchEditMode } = useStore(state => state.practiceActions)

    return (
        <div className='flex items-center gap-4 p-4'>
            <Button variant='icon'>
                <ListIcon size={18} />
            </Button>
            <div className='flex items-center'>
                <Button variant='ghost'>
                    <HouseSimpleIcon size={18} />
                </Button>
                <span className='mr-2'>/</span>
                <h1 className='text-sm'>考研数学历年真题</h1>
            </div>
            <span className='flex-1' />
            {!isEditing && (
                <>
                    <Button variant='primary' disabled={!selectedSubject}>
                        <PlayIcon size={18} weight='bold' />
                        开始专题
                    </Button>
                    <Button>
                        <ShuffleAngularIcon size={18} />
                        随机刷题
                    </Button>
                </>
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
