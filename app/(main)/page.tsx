'use client'

import { Navigation } from '@/components/home/navigation'
import { PracticeCreator } from '@/components/home/practice-creator'
import { PracticeImporter } from '@/components/home/practice-importer'
import { PracticeSet } from '@/components/home/practice-set'
import { usePracticeSetStore } from '@/store/practice-set'
import { useState, useEffect } from 'react'

export const Tab = {
    public: '公共题库',
    own: '我的题库',
    star: '收藏',
} as const

export default function Home() {
    const [tab, setTab] = useState<keyof typeof Tab>('public')

    const presetData = usePracticeSetStore(s => s.presetData)
    const privateData = usePracticeSetStore(s => s.privateData)
    const { loadPresetData, loadPrivateData } = usePracticeSetStore(s => s.actions)

    useEffect(() => {
        loadPrivateData()
        loadPresetData()
    }, [loadPresetData, loadPrivateData])

    async function handleNavigate(tab: keyof typeof Tab) {
        setTab(tab)
    }

    return (
        <div className='flex h-full w-full gap-6 overflow-hidden'>
            <Navigation navigation={tab} onNavigate={handleNavigate} />
            <div className='flex flex-col'>
                <header className='my-4 flex h-10 items-center text-xl font-bold'>{Tab[tab]}</header>
                <div className='flex flex-wrap gap-8'>
                    {tab === 'public' &&
                        presetData.map(it => (
                            <PracticeSet
                                key={it.id}
                                id={it.id}
                                route={`/${it.id}?public`}
                                title={it.title}
                                updatedAt={it.updatedAt}
                            />
                        ))}
                    {tab === 'own' && (
                        <>
                            <PracticeImporter />
                            <PracticeCreator />
                            {privateData.map(it => (
                                <PracticeSet
                                    key={it.id}
                                    id={it.id}
                                    route={`/${it.id}`}
                                    title={it.title}
                                    editable
                                    updatedAt={it.updatedAt}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
