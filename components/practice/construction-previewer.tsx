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
import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../common/button'
import { ChunkData } from '@/store/interface'
import ImageRenderer from '../common/image-renderer'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface Props {
    open: boolean
    chunks: ChunkData[]
    children: React.ReactNode
    onConfirm: (title: string) => void
    onOpenChange: (open: boolean) => void
}
export function ConstructionPreviewer({ open, chunks, onConfirm, onOpenChange, children }: Props) {
    const [title, setTitle] = useState('')

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value)
    }

    function handleConfirm() {
        onConfirm(title)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children}
            <DialogContent className='flex max-h-full flex-col overflow-hidden'>
                <DialogHeader>
                    <DialogTitle>预览</DialogTitle>
                    <VisuallyHidden>
                        <DialogDescription>预览并保存</DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                <Input value={title} onChange={handleTitleChange} className='mb-2' placeholder='在此输入题库名称' />
                <div className='flex flex-1 flex-col overflow-auto'>
                    {chunks.map(chunk => (
                        <ImageRenderer key={chunk.id} src={chunk.source} className='w-full' />
                    ))}
                </div>
                <DialogFooter className='shrink-0'>
                    <Button variant='primary' disabled={title === ''} onClick={handleConfirm}>
                        立即创建
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
