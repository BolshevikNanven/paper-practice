'use client'

import { CaretLeftIcon } from '@phosphor-icons/react'
import { Button } from '../common/button'
import { usePracticeStore } from '@/store/practice'

interface Props {
    title: string
    children: React.ReactNode
}
export function ConstructionHeader({ title, children }: Props) {
    const { switchConstruction } = usePracticeStore(s => s.actions)

    return (
        <header className='flex h-10 items-center gap-4 pr-8 pl-6'>
            <Button variant='icon' onClick={() => switchConstruction(false)}>
                <CaretLeftIcon size={18} />
            </Button>
            <h3 className='mr-auto font-bold'>{title}</h3>
            {children}
        </header>
    )
}
