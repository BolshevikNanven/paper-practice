'use client'

import { Dialog, DialogContent } from './playground-dialog'

import { ButtonGroup } from '../common/button-group'
import { Button } from '../common/button'
import { ExamIcon, MinusIcon, PlusIcon, StarIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { usePracticeStore } from '@/store/practice'

export function PracticePlayground() {
    const isOpen = usePracticeStore(s => s.playgroundOpened)
    const chunks = usePracticeStore(s => s.playgroundChunks)
    const { closePlayground } = usePracticeStore(s => s.actions)

    const [scaleRatio, setScaleRatio] = useState(50)

    function handleOpenChange(state: boolean) {
        if (state !== isOpen && !state) {
            closePlayground()
        }
    }

    function handleScaleIn() {
        if (scaleRatio > 30) {
            setScaleRatio(scaleRatio - 10)
        }
    }

    function handleScaleOut() {
        if (scaleRatio < 100) {
            setScaleRatio(scaleRatio + 10)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className='flex flex-col items-center overflow-auto py-4'>
                <header className='sticky top-0 left-0 flex w-full px-4'>
                    <div className='mx-auto flex'>
                        <ButtonGroup>
                            <Button onClick={handleScaleIn}>
                                <MinusIcon />
                            </Button>
                            <span className='flex items-center bg-card px-0.5 text-sm'>{scaleRatio}%</span>
                            <Button onClick={handleScaleOut}>
                                <PlusIcon />
                            </Button>
                        </ButtonGroup>
                    </div>
                </header>
                <main className='m-auto flex flex-col gap-8 pb-[40vh] pt-12' style={{ width: scaleRatio + '%' }}>
                    {chunks.map(it => (
                        <div key={it.id} className='flex flex-col'>
                            <img src={it.source} alt='practicing' className='rounded-sm rounded-br-none border' />
                            <div className='relative ml-auto flex h-10 -translate-y-px'>
                                <div className='absolute top-0 right-0 -z-10 h-full w-[calc(100%-16px)] rounded-br-xl border-r border-b bg-card' />
                                <Mask className='absolute top-0 -left-9 -z-10' />
                                <Button variant='ghost'>
                                    <ExamIcon size={18} />
                                    详解
                                </Button>
                                <Button variant='ghost'>
                                    <StarIcon size={18} />
                                    收藏
                                </Button>
                            </div>
                        </div>
                    ))}
                </main>
            </DialogContent>
        </Dialog>
    )
}

function Mask({ className }: { className?: ClassValue }) {
    return (
        <svg
            width='60'
            height='40'
            viewBox='0 0 60 42'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            preserveAspectRatio='none'
            className={cn('rotate-x-180 rotate-y-180', className)}
        >
            <mask
                id='error_overlay_nav_mask0_2667_14687'
                maskUnits='userSpaceOnUse'
                x='0'
                y='-1'
                width='60'
                height='43'
                style={{ maskType: 'alpha' }}
            >
                <mask
                    id='error_overlay_nav_path_1_outside_1_2667_14687'
                    maskUnits='userSpaceOnUse'
                    x='0'
                    y='-1'
                    width='60'
                    height='43'
                    fill='black'
                >
                    <rect fill='white' y='-1' width='60' height='43'></rect>
                    <path d='M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z'></path>
                </mask>
                <path
                    d='M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z'
                    fill='white'
                ></path>
                <path
                    d='M1 0V-1H0V0L1 0ZM1 41H0V42H1V41ZM34.8889 29.6498L33.9873 30.0823L34.8889 29.6498ZM26.111 11.3501L27.0127 10.9177L26.111 11.3501ZM1 1H8.0783V-1H1V1ZM60 40H1V42H60V40ZM2 41V0L0 0L0 41H2ZM25.2094 11.7826L33.9873 30.0823L35.7906 29.2174L27.0127 10.9177L25.2094 11.7826ZM52.9217 42H60V40H52.9217V42ZM33.9873 30.0823C37.4811 37.3661 44.8433 42 52.9217 42V40C45.6127 40 38.9517 35.8074 35.7906 29.2174L33.9873 30.0823ZM8.0783 1C15.3873 1 22.0483 5.19257 25.2094 11.7826L27.0127 10.9177C23.5188 3.6339 16.1567 -1 8.0783 -1V1Z'
                    fill='black'
                    mask='url(#error_overlay_nav_path_1_outside_1_2667_14687)'
                ></path>
            </mask>
            <g mask='url(#error_overlay_nav_mask0_2667_14687)'>
                <mask
                    id='error_overlay_nav_path_3_outside_2_2667_14687'
                    maskUnits='userSpaceOnUse'
                    x='-1'
                    y='0.0244141'
                    width='60'
                    height='43'
                    fill='black'
                >
                    <rect fill='white' x='-1' y='0.0244141' width='60' height='43'></rect>
                    <path d='M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z'></path>
                </mask>
                <path
                    d='M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z'
                    fill='var(--card)'
                ></path>
                <path
                    d='M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z'
                    fill='var(--border)'
                    mask='url(#error_overlay_nav_path_3_outside_2_2667_14687)'
                ></path>
            </g>
        </svg>
    )
}
