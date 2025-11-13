'use client'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '../common/button'
import { usePracticeStore } from '@/store/practice'
import { useMemo, useState } from 'react'
import { flattenSubjectsTree } from '@/lib/utils'
import Subject from './subject'

interface Props {
    selectedSubjects: string[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (title: string) => void
}
export function SubjectSelector({ open, selectedSubjects, onOpenChange, onSelect }: Props) {
    const overviewData = usePracticeStore(s => s.overviewData)

    const flatNodes = useMemo(() => {
        if (!overviewData) {
            return []
        }
        return flattenSubjectsTree(overviewData)
    }, [overviewData])

    function handleSelect(title: string) {
        onSelect(title)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>选择标签</DialogTitle>
                </DialogHeader>
                <span className='h-px bg-border' />
                <div className='flex flex-col gap-px overflow-auto'>
                    {flatNodes.map(node => (
                        <Subject
                            key={node.title}
                            node={node}
                            deep={node.deep}
                            active={selectedSubjects.some(it => it === node.title)}
                            onClick={handleSelect}
                        />
                    ))}
                </div>
                <DialogFooter>
                    <Button variant='primary' onClick={() => onOpenChange(false)}>
                        选择完毕
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
