'use client'

import { Navigation } from '@/components/home/navigation'
import { PracticeSet } from '@/components/home/practice-set'
import { Repository } from '@/db/repository'
import { getPresetPracticeSets } from '@/lib/cache'
import { PracticeSetData, PresetPracticeMapData } from '@/store/interface'
import { PlusIcon } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

export const Tab = {
    public: '公共题库',
    own: '我的题库',
    star: '收藏',
} as const

export default function Home() {
    const [tab, setTab] = useState<keyof typeof Tab>('public')

    const [presetData, setPresetData] = useState<PresetPracticeMapData[]>([])
    const [privateData, setPrivateData] = useState<PracticeSetData[]>([])

    useEffect(() => {
        getPresetPracticeSets().then(setPresetData)
    }, [])

    async function handleNavigate(tab: keyof typeof Tab) {
        switch (tab) {
            case 'public': {
                const data = await getPresetPracticeSets()
                setPresetData(data)
                break
            }
            case 'own': {
                const data = await Repository.listPracticeSets()
                setPrivateData(data)
                break
            }
            default:
                break
        }

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
                            <PracticeSet key={it.id} route={`/${it.id}?public`} title={it.title} updatedAt={it.updatedAt} />
                        ))}
                    {tab === 'own' && (
                        <>
                            <div className='flex aspect-3/4 w-60 cursor-pointer flex-col border-2 p-4 transition-all hover:scale-105 active:scale-95'>
                                <PlusIcon size={32} className='m-auto text-muted-foreground' />
                                <p className=' text-sm'>创建新题库</p>
                            </div>
                            {privateData.map(it => (
                                <PracticeSet key={it.id} route={`/${it.id}`} title={it.title} updatedAt={it.updatedAt} />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
