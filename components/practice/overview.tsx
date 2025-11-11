'use client'

import { PracticeNode, PracticeOverviewItem } from './overview-item'
import { useMemo } from 'react'
import { useStore } from '@/store'
import { MovableDivider } from '../common/movable-divider'

const overviewData = [
    {
        title: '数列敛散性的判定',
        children: [{ title: '子目录1' }, { title: '子目录2', children: [{ title: '科目2' }] }],
    },
    { title: '极限存在性' },
    { title: '函数连续性', children: [{ title: '科目1' }] },
]

function flattenTree(nodes: typeof overviewData, deep = 0) {
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
    const selectedSubject = useStore(state => state.practiceSubjectSelected)

    const flatNodes = useMemo(() => flattenTree(overviewData), [])

    return (
        <>
            <div className='relative flex h-full w-[286px] shrink-0 flex-col overflow-auto px-4'>
                <h3 className='sticky top-0 left-0 mb-2 flex h-10 shrink-0 items-center bg-zinc-50 px-2 font-semibold'>
                    考点目录
                </h3>
                <div className='h-px bg-border mb-2'></div>
                {flatNodes.map((node, idx) => (
                    <PracticeOverviewItem
                        key={idx}
                        node={node}
                        deep={node.deep}
                        active={selectedSubject === node.title}
                    />
                ))}
            </div>
            <MovableDivider />
        </>
    )
}
