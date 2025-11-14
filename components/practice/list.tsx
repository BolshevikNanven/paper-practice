'use client'

import { RailScroller } from '../common/rail-scroller'
import { PracticePlayground } from './playground'
import { Practice } from './practice'

import { motion } from 'motion/react'
import { usePracticeStore } from '@/store/practice'

export function PracticeList() {
    const data = usePracticeStore(s => s.selectingPracticeSetData!.set)

    return (
        <>
            <RailScroller>
                <div className='flex gap-6 px-6'>
                    {data.map((practice, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, translateX: '12px' }}
                            animate={{ opacity: 1, translateX: '0' }}
                            transition={{ duration: 0.28, delay: idx * 0.09 }}
                        >
                            <Practice data={practice} />
                        </motion.div>
                    ))}
                </div>
            </RailScroller>
            <PracticePlayground />
        </>
    )
}
