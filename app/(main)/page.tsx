'use client'

import { Navigation } from '@/components/home/navigation'
import { useState } from 'react'

export const Tab = {
    public: '公共题库',
    own: '我的题库',
    star: '收藏',
} as const

export default function Home() {
    const [tab, setTab] = useState<keyof typeof Tab>('public')

    return (
        <div className='flex h-full w-full gap-6 overflow-hidden'>
            <Navigation navigation={tab} onNavigate={setTab} />
            <div className='flex flex-col'>
                <header className='m-4 flex h-10 items-center text-xl font-bold'>
                    {Tab[tab]}
                </header>
            </div>
        </div>
    )
}
