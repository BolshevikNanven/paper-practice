'use client'

import { CaretLeftIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { MovableDivider } from '../common/movable-divider'
import { useStore } from '@/store'

export function PracticeConstruction() {
    const { switchConstruction } = useStore(state => state.practiceActions)

    return (
        <div className='flex flex-1 gap-4 overflow-hidden px-6'>
            <div className='flex flex-1 flex-col'>
                <header className='flex h-10 items-center gap-4'>
                    <Button variant='icon' onClick={() => switchConstruction(false)}>
                        <CaretLeftIcon size={18} />
                    </Button>
                    <h3 className='font-bold'>创建新资料</h3>
                </header>
                <div className='my-6 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-3xl border-4 border-dashed'>
                    <UploadSimpleIcon size={64} className='text-border' weight='bold' />
                    <p className='mt-2 text-muted-foreground'>点击或拖拽图片到此上传</p>
                </div>
            </div>
            <MovableDivider />
            <div className='w-[320px]'></div>
        </div>
    )
}
