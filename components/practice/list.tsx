'use client'

import { RailScroller } from '../common/rail-scroller'
import { Practice } from './practice'

import { motion } from 'motion/react'
import { usePracticeStore } from '@/store/practice'

import { useUniformCardWidth, LayoutConstants } from '@/hooks/use-uniform-card-width'
import { ChunkData, PracticeData } from '@/store/interface'
import { SpinnerIcon } from '@phosphor-icons/react'

const CARD_LAYOUT_CONSTANTS: LayoutConstants = {
    titleHeight: 40,
    cardPaddingBottom: 24,
    maxWidth: 380,
}
export function PracticeList() {
    const data = usePracticeStore(s => s.selectingPracticeSetData!.set)

    const { containerRef, finalWidth, measuringRoom, isCalculating } = useUniformCardWidth<PracticeData, ChunkData>({
        data: data || [],
        itemKeyExtractor: item => item.id,
        chunksExtractor: item => item.chunks,
        chunkSourceExtractor: chunk => chunk.source,
        layoutConstants: CARD_LAYOUT_CONSTANTS,
    })

    return (
        <>
            {measuringRoom}
            <RailScroller>
                <div className='flex gap-6 px-6' ref={containerRef}>
                    {!isCalculating ? (
                        data.map((practice, idx) => (
                            <motion.div
                                key={idx}
                                className='h-full'
                                initial={{ opacity: 0, translateX: '12px' }}
                                style={{ width: `${(finalWidth || -16) + 16}px` }}
                                animate={{ opacity: 1, translateX: '0' }}
                                transition={{ duration: 0.28, delay: idx * 0.09 }}
                            >
                                <Practice data={practice} />
                            </motion.div>
                        ))
                    ) : (
                        <div>
                            <SpinnerIcon className='animate-spin' size={28} />
                        </div>
                    )}
                </div>
            </RailScroller>
        </>
    )
}
