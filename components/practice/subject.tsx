'use client'

import { cn } from '@/lib/utils'
import { OverviewData, usePracticeStore } from '@/store/practice'
import { nanoid } from 'nanoid'
import { memo, useState } from 'react'
import { Button } from '../common/button'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { useDialog } from '../common/confirm-dialog'

export interface PracticeNode {
    title: string
    children?: PracticeNode[]
    deep?: number
}

interface Props {
    node: PracticeNode
    active?: boolean
    deep?: number
    editing?: boolean
    onClick?: (title: string) => void
}

export default memo(function PracticeSubject({ node, deep = 0, active, editing, onClick }: Props) {
    const overviewData = usePracticeStore(s => s.overviewData)
    const { setOverviewData } = usePracticeStore(s => s.actions)

    const [isSelfEditing, setIsSelfEditing] = useState(false)
    const [currentTitle, setCurrentTitle] = useState(node.title)

    const dialog = useDialog()

    function handleSelect() {
        if (editing) {
            setIsSelfEditing(true)
            return
        }
        onClick?.(node.title)
    }

    // 3. 重命名
    function handleRename() {
        if (!overviewData || !currentTitle || currentTitle === node.title) {
            setIsSelfEditing(false)
            return
        }
        // 使用辅助函数计算新树
        const newTree = findAndUpdate(overviewData, node.title, currentTitle)
        setOverviewData(newTree)
        setIsSelfEditing(false)
    }

    // 4. 删除
    function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
        dialog({
            title: `确定要删除 "${node.title}" 吗？`,
            description: '该操作不可撤销！',
            onConfirm: () => {
                const newTree = findAndRemove(overviewData!, node.title)
                setOverviewData(newTree)
            },
        })
    }

    // 5. 添加子节点
    function handleAddChild(e: React.MouseEvent) {
        e.stopPropagation()
        if (!overviewData) return

        const newTitle = `新子项 ${nanoid()}}`
        const newNode: OverviewData = { title: newTitle }

        // 使用辅助函数计算新树
        const newTree = findAndAdd(overviewData, node.title, newNode)
        setOverviewData(newTree)
    }

    function findAndRemove(nodes: OverviewData[], title: string): OverviewData[] {
        return nodes
            .filter(node => node.title !== title) // 1. 在当前层级过滤
            .map(node => {
                if (node.children) {
                    // 2. 如果有子节点，递归处理子节点
                    return { ...node, children: findAndRemove(node.children, title) }
                }
                return node // 3. 没有子节点，直接返回
            })
    }

    function findAndUpdate(nodes: OverviewData[], oldTitle: string, newTitle: string): OverviewData[] {
        return nodes.map(node => {
            if (node.title === oldTitle) {
                // 1. 找到了，返回一个标题已更新的新节点
                return { ...node, title: newTitle }
            }
            if (node.children) {
                // 2. 没找到，但有子节点，递归处理
                return { ...node, children: findAndUpdate(node.children, oldTitle, newTitle) }
            }
            return node // 3. 没找到，没子节点，原样返回
        })
    }

    function findAndAdd(nodes: OverviewData[], parentTitle: string, newNode: OverviewData): OverviewData[] {
        return nodes.map(node => {
            if (node.title === parentTitle) {
                // 1. 找到了父节点，将新节点添加到其 children
                return {
                    ...node,
                    children: [...(node.children || []), newNode],
                }
            }
            if (node.children) {
                // 2. 没找到，但有子节点，递归处理
                return { ...node, children: findAndAdd(node.children, parentTitle, newNode) }
            }
            return node // 3. 没找到，没子节点，原样返回
        })
    }

    // 6. 内联编辑的 Input
    if (editing && isSelfEditing) {
        return (
            <div className='flex h-9 shrink-0 items-center pl-2 text-sm' style={{ paddingLeft: deep * 16 + 3 + 'px' }}>
                <input
                    type='text'
                    value={currentTitle}
                    onChange={e => setCurrentTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                    className='h-full w-full rounded-md border bg-card px-1 text-sm shadow outline-0'
                    autoFocus
                />
            </div>
        )
    }

    // 7. 默认显示
    return (
        <div
            onClick={handleSelect}
            className={cn(
                'group flex h-9 shrink-0 cursor-pointer items-center justify-between rounded-md px-2 text-sm text-accent-foreground transition-colors hover:bg-accent',
                {
                    'bg-main font-bold text-background hover:bg-main': active && !editing,
                    'cursor-text hover:bg-accent hover:pr-1': editing,
                },
            )}
            style={{ paddingLeft: deep * 16 + 8 + 'px' }}
        >
            <span className='overflow-hidden text-nowrap text-ellipsis whitespace-nowrap'>{node.title}</span>

            {editing && (
                <div className='hidden shrink-0 items-center gap-1 group-hover:flex'>
                    <Button variant='icon' size='sm' onClick={handleAddChild}>
                        <PlusIcon />
                    </Button>
                    <Button variant='icon' size='sm' onClick={handleDelete} className='text-red-600'>
                        <TrashIcon />
                    </Button>
                </div>
            )}
        </div>
    )
})
