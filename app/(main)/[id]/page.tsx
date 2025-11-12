'use client'

import { motion } from 'motion/react'

import { PracticeConstruction } from '@/components/practice/construction'
import { PracticeHeader } from '@/components/practice/header'
import { PracticeList } from '@/components/practice/list'
import { PracticeOverview } from '@/components/practice/overview'
import { usePracticeStore } from '@/store/practice'

export default function PracticePage() {
    const isEditing = usePracticeStore(s => s.editing)
    const constructing = usePracticeStore(s => s.constructing)

    return (
        <div className='flex h-full w-full flex-col overflow-hidden'>
            <PracticeHeader />
            <main className='flex flex-1 overflow-hidden'>
                <PracticeOverview />
                {isEditing && constructing ? <PracticeConstruction /> : <PracticeList />}
            </main>
            {isEditing && (
                <motion.div
                    initial={{ transform: 'translateY(8px)' }}
                    animate={{ transform: 'translateY(0)' }}
                    transition={{ duration: 0.14 }}
                    className='striped-warning h-2'
                />
            )}
        </div>
    )
}
