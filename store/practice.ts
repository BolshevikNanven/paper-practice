import { create } from 'zustand'
import { ChunkData, OverviewData, PracticeData, PracticeSetData } from './interface'
import { Repository } from '@/db/repository'

interface Store {
    editing: boolean
    constructing: boolean | string
    selectingSubject?: string
    selectingPracticeSetData?: PracticeSetData
    actions: {
        switchEditMode: (state?: boolean) => void
        switchConstruction: (item: Store['constructing']) => void
        selectSubject: (subject?: string) => void
        loadPracticeSetData: (id: string, preset?: boolean) => Promise<void>
        updateOverviewData: (data: OverviewData[]) => Promise<void>
        createPractice: (data: PracticeData) => Promise<void>
        updatePractice: (data: PracticeData) => Promise<void>
        deletePractice: (id: string) => Promise<void>
    }
}

const initial = {
    editing: false,
    constructing: false,
    constructingChunks: [],
    subjectSelected: undefined,
    selectingPracticeSetData: undefined,
}

export const usePracticeStore = create<Store>()((set, get) => ({
    ...initial,
    actions: {
        switchEditMode(state) {
            set({
                editing: state === undefined ? !get().editing : state,
                selectingSubject: undefined,
                constructing: undefined,
            })
        },
        switchConstruction(item) {
            set({ constructing: item })
        },
        selectSubject(subject) {
            set({ selectingSubject: subject })
        },
        async loadPracticeSetData(id, preset) {
            let data: PracticeSetData | undefined
            if (!preset) {
                data = await Repository.getFullPracticeSet(id)
            } else {
                try {
                    data = await (await fetch(`/practices/${id}/data.json`)).json()
                } catch (error) {}
            }

            set({ selectingPracticeSetData: data })
        },
        async updateOverviewData(data) {
            const practiceSet = get().selectingPracticeSetData
            if (!practiceSet) {
                return
            }
            await Repository.updatePracticeSetMeta(practiceSet.id, { overview: data })
            set({ selectingPracticeSetData: { ...practiceSet, overview: data } })
        },
        async createPractice(data) {
            const setId = get().selectingPracticeSetData?.id
            if (!setId) {
                return
            }
            await Repository.createPractice(setId, data)
            get().actions.loadPracticeSetData(setId)
            get().actions.switchConstruction(false)
        },
        async updatePractice(data) {
            const setId = get().selectingPracticeSetData?.id
            if (!setId) {
                return
            }

            await Repository.updatePractice(data.id, data)
            get().actions.loadPracticeSetData(setId)
            get().actions.switchConstruction(false)
        },
        async deletePractice(id) {
            const setId = get().selectingPracticeSetData?.id
            if (!setId) {
                return
            }
            await Repository.deletePractice(id)
            get().actions.loadPracticeSetData(setId)
            get().actions.switchConstruction(false)
        },
    },
}))
