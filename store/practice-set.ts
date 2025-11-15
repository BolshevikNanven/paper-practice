import { create } from 'zustand'
import { PracticeSetData, PresetPracticeMapData } from './interface'
import { getPresetPracticeSets } from '@/lib/cache'
import { Repository } from '@/db/repository'

interface Store {
    presetData: PresetPracticeMapData[]
    privateData: PracticeSetData[]
    actions: {
        loadPresetData: () => Promise<void>
        loadPrivateData: () => Promise<void>
        deletePracticeSet: (id: string) => Promise<void>
        updatePracticeSetTitle: (id: string, title: string) => Promise<void>
    }
}

const initial = {
    presetData: [],
    privateData: [],
}

export const usePracticeSetStore = create<Store>()((set, get) => ({
    ...initial,
    actions: {
        async loadPresetData() {
            const data = await getPresetPracticeSets()

            set({ presetData: data })
        },
        async loadPrivateData() {
            const data = await Repository.listPracticeSets()

            set({ privateData: data })
        },
        async deletePracticeSet(id) {
            await Repository.deletePracticeSet(id)
            await get().actions.loadPrivateData()
        },
        async updatePracticeSetTitle(id, title) {
            await Repository.updatePracticeSetMeta(id, { title })
            await get().actions.loadPrivateData()
        },
    },
}))
