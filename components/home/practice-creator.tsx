'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '../common/button'
import { Repository } from '@/db/repository'
import { usePracticeSetStore } from '@/store/practice-set'

export function PracticeCreator() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')

    const { loadPrivateData } = usePracticeSetStore(s => s.actions)

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value)
    }

    async function handleConfirm() {
        try {
            await Repository.createPracticeSet(title)
            loadPrivateData()
        } catch (error) {}
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className='flex aspect-3/4 w-60 cursor-pointer flex-col border-2 p-4 transition-all hover:scale-105 active:scale-95'>
                    <PlusIcon size={32} className='m-auto text-muted-foreground' />
                    <p className='text-sm'>创建新题库</p>
                </div>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>创建新题库</DialogTitle>
                    <DialogDescription>首先需要为你的新题库取一个名称</DialogDescription>
                </DialogHeader>
                <Input value={title} onChange={handleTitleChange} placeholder='在此输入题库名称' />
                <DialogFooter>
                    <Button variant='primary' type='submit' disabled={title === ''} onClick={handleConfirm}>
                        立即创建
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
