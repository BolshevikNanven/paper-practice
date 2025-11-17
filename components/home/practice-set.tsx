'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { CursorTextIcon, ExportIcon, FolderOpenIcon, TrashIcon } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useDialog } from '@/hooks/use-dialog'
import { usePracticeSetStore } from '@/store/practice-set'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../common/button'
import { Input } from '../ui/input'
import { useState } from 'react'
import { Persist } from '@/lib/persist'

interface Props {
    route: string
    id: string
    title: string
    updatedAt: string
    editable?: boolean
}
export function PracticeSet({ route, title, id, updatedAt, editable }: Props) {
    const router = useRouter()
    const dialog = useDialog()

    const { deletePracticeSet, updatePracticeSetTitle } = usePracticeSetStore(s => s.actions)
    const [editingTitle, setEditTitle] = useState('')

    function enter() {
        router.push(route)
    }

    function handleDelete() {
        dialog({
            title: `确认要删除 ${title} 吗`,
            description: '将删除题库所有内容，此操作不可撤销！',
            async onConfirm() {
                await deletePracticeSet(id)
            },
        })
    }

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setEditTitle(e.target.value)
    }

    async function handleConfirmTitle() {
        await updatePracticeSetTitle(id, editingTitle)
        setEditTitle('')
    }

    async function handleExport() {
        await Persist.exportPracticeSetAsZip(id)
    }

    return (
        <Dialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div
                        onClick={enter}
                        className='group relative flex aspect-3/4 w-60 flex-col border bg-card p-4 shadow-lg transition-all hover:scale-105 active:scale-95'
                    >
                        <p className='mt-auto leading-5 text-wrap break-all whitespace-break-spaces'>{title}</p>
                        <span className='mt-2 text-xs text-muted-foreground'>{updatedAt}</span>
                    </div>
                </DropdownMenuTrigger>
                {editable && (
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={enter}>
                            <FolderOpenIcon />
                            打开
                        </DropdownMenuItem>
                        <DialogTrigger asChild>
                            <DropdownMenuItem>
                                <CursorTextIcon />
                                修改名称
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem onClick={handleExport}>
                            <ExportIcon />
                            导出
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant='destructive' onClick={handleDelete}>
                            <TrashIcon />
                            删除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                )}
            </DropdownMenu>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>修改名称</DialogTitle>
                </DialogHeader>
                <Input value={editingTitle} onChange={handleTitleChange} placeholder='在此输入新名称' />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant='primary' disabled={editingTitle === ''} onClick={handleConfirmTitle}>
                            确认修改
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
