'use client'

import { PracticeConstruction } from '@/components/practice/construction'
import { PracticeHeader } from '@/components/practice/header'
import { PracticeList } from '@/components/practice/list'
import { PracticeOverview } from '@/components/practice/overview'
import { useStore } from '@/store'

export default function PracticePage() {
    const isEditing = useStore(state => state.practiceEditing)
    const constructing = useStore(state => state.practiceConstructing)

    return (
        <div className='flex h-full w-full flex-col overflow-hidden'>
            <PracticeHeader />
            <main className='flex flex-1 overflow-hidden'>
                <PracticeOverview />
                {isEditing && constructing ? <PracticeConstruction /> : <PracticeList />}
            </main>
            {isEditing && <div className='striped-warning h-2'></div>}
        </div>
    )
}
