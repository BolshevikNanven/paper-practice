'use client'

import PracticeSubject from './subject'
import { useMemo, useState } from 'react'
import { MovableDivider } from '../common/movable-divider'
import { usePracticeStore } from '@/store/practice'
import { Button } from '../common/button'
import { ListPlusIcon } from '@phosphor-icons/react'
import { flattenSubjectsTree } from '@/lib/utils'
import { OverviewData } from '@/store/interface'
import { useGeneralStore } from '@/store/general'

export function PracticeOverview() {
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const overviewData = usePracticeStore(s => s.selectingPracticeSetData!.overview)
    const editing = usePracticeStore(s => s.editing)

    const { selectSubject, updateOverviewData } = usePracticeStore(s => s.actions)

    const width = useGeneralStore(s => s.overviewWidth)
    const shown = useGeneralStore(s => s.overviewShown)
    const setWidth = useGeneralStore(s => s.actions.setOverviewWidth)

    const flatNodes = useMemo(() => {
        if (!overviewData) {
            return []
        }
        return flattenSubjectsTree(overviewData)
    }, [overviewData])

    function handleAddRootNode() {
        const newTitle = `新章节 ${Date.now()}`
        const newNode: OverviewData = { title: newTitle }

        const newTree = overviewData ? [...overviewData, newNode] : [newNode]

        updateOverviewData(newTree)
    }

    function handleResize(dx: number) {
        setWidth(prev => (prev + dx > 240 && prev + dx < 500 ? prev + dx : prev))
    }

    if (shown)
        return (
            <>
                <div className='relative flex h-full shrink-0 flex-col overflow-auto px-4 pb-8' style={{ width: width + 'px' }}>
                    <div className='sticky top-0 left-0 z-10 mb-2 flex shrink-0 items-center border-b bg-zinc-50 pb-2 font-semibold'>
                        <div className='flex h-10 w-full items-center pl-2'>
                            目录
                            {editing && (
                                <Button onClick={handleAddRootNode} className='ml-auto font-medium'>
                                    <ListPlusIcon size={18} />
                                    添加新专题
                                </Button>
                            )}
                        </div>
                    </div>
                    {flatNodes.map(node => (
                        <PracticeSubject
                            key={node.title}
                            node={node}
                            deep={node.deep}
                            active={selectedSubject === node.title}
                            editing={editing}
                            onClick={() => (selectedSubject === node.title ? selectSubject('') : selectSubject(node.title))}
                        />
                    ))}
                </div>
                <MovableDivider onMove={handleResize} />
            </>
        )
}
