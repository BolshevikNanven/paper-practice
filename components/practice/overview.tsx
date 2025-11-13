'use client'

import PracticeSubject from './subject'
import { useMemo, useState } from 'react'
import { MovableDivider } from '../common/movable-divider'
import { OverviewData, usePracticeStore } from '@/store/practice'
import { Button } from '../common/button'
import { ListPlusIcon } from '@phosphor-icons/react'
import { flattenSubjectsTree } from '@/lib/utils'

export function PracticeOverview() {
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const overviewData = usePracticeStore(s => s.overviewData)
    const editing = usePracticeStore(s => s.editing)

    const { selectSubject, setOverviewData } = usePracticeStore(s => s.actions)

    const [width, setWidth] = useState(286)

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

        setOverviewData(newTree)
    }

    function handleResize(dx: number) {
        setWidth(prev => (prev + dx > 240 && prev + dx < 500 ? prev + dx : prev))
    }

    return (
        <>
            <div className='relative flex h-full shrink-0 flex-col overflow-auto px-4' style={{ width: width + 'px' }}>
                <div className='sticky top-0 left-0 mb-2 flex h-10 shrink-0 items-center bg-zinc-50 pl-2 font-semibold'>
                    目录
                    {editing && (
                        <Button onClick={handleAddRootNode} className='ml-auto font-medium'>
                            <ListPlusIcon size={18} />
                            添加新章节
                        </Button>
                    )}
                </div>
                <div className='mb-2 h-px bg-border'></div>
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
