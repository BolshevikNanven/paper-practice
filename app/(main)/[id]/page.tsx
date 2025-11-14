'use client'

import { motion } from 'motion/react'

import { PracticeConstruction } from '@/components/practice/construction'
import { PracticeHeader } from '@/components/practice/header'
import { PracticeList } from '@/components/practice/list'
import { PracticeOverview } from '@/components/practice/overview'
import { usePracticeStore } from '@/store/practice'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HouseIcon, SpinnerIcon } from '@phosphor-icons/react'
import { Button } from '@/components/common/button'
import Link from 'next/link'

export default function PracticePage() {
    const { id } = useParams()
    const searchParams = useSearchParams()

    const isEditing = usePracticeStore(s => s.editing)
    const constructing = usePracticeStore(s => s.constructing)
    const selectingPracticeSetData = usePracticeStore(s => s.selectingPracticeSetData)
    const { loadPracticeSetData } = usePracticeStore(s => s.actions)

    const [isLoading, setIsLoading] = useState(true)

    const loadData = useCallback(async () => {
        const isPublic = searchParams.has('public')

        setIsLoading(true)
        await loadPracticeSetData(id as string, isPublic)
        setIsLoading(false)
    }, [id, searchParams, loadPracticeSetData])

    useEffect(() => {
        ;(async () => {
            await loadData()
        })()
    }, [loadData])

    if (isLoading) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center overflow-hidden'>
                <SpinnerIcon size={40} className='animate-spin transition-all' />
            </div>
        )
    } else if (!selectingPracticeSetData) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center overflow-hidden'>
                error
                <Link href={'/'}>
                    <Button className='mt-4'>
                        <HouseIcon size={18} />
                    </Button>
                </Link>
            </div>
        )
    }
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
