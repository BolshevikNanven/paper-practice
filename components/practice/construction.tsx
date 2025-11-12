'use client'

import { MovableDivider } from '../common/movable-divider'
import { ConstructionCreator } from './construction-creator'
import { usePracticeStore } from '@/store/practice'

export function PracticeConstruction() {
    const constructing = usePracticeStore(s => s.constructing)

    return (
        <div className='flex flex-1 overflow-hidden'>
            <div className='flex flex-1 flex-col gap-4'>
                {typeof constructing === 'string' ? < ></> : <ConstructionCreator />}
            </div>
            <MovableDivider />
            <div className='flex w-[380px] flex-col pl-4'>
                <div className='mb-2 flex h-10 items-center'>
                    <h3 className='mr-auto font-bold'>预览</h3>
                </div>
                <div className='mb-2 h-px bg-border'></div>
            </div>
        </div>
    )
}
