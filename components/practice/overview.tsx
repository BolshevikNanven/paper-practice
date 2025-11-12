'use client'

import { PracticeNode, PracticeOverviewItem } from './overview-item'
import { useMemo } from 'react'
import { MovableDivider } from '../common/movable-divider'
import { OverviewData, usePracticeStore } from '@/store/practice'

function flattenTree(nodes: Array<OverviewData>, deep = 0) {
    let result: Array<PracticeNode> = []
    for (const node of nodes) {
        result.push({ ...node, deep })
        if (node.children) {
            result = result.concat(flattenTree(node.children, deep + 1))
        }
    }
    return result
}

export function PracticeOverview() {
    const selectedSubject = usePracticeStore(s => s.selectingSubject)
    const overviewData = usePracticeStore(s => s.overviewData)

    const flatNodes = useMemo(() => {
        if (!overviewData) {
            return []
        }
        return flattenTree(overviewData)
    }, [overviewData])

    return (
        <>
            <div className='relative flex h-full w-[286px] shrink-0 flex-col overflow-auto px-4'>
                <h3 className='sticky top-0 left-0 mb-2 flex h-10 shrink-0 items-center bg-zinc-50 px-2 font-semibold'>目录</h3>
                <div className='mb-2 h-px bg-border'></div>
                {flatNodes.map((node, idx) => (
                    <PracticeOverviewItem key={idx} node={node} deep={node.deep} active={selectedSubject === node.title} />
                ))}
            </div>
            <MovableDivider />
        </>
    )
}
