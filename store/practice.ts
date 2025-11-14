import { create } from 'zustand'
import { ChunkData, OverviewData, PracticeSetData } from './interface'
import { Repository } from '@/db/repository'

interface Store {
    editing: boolean
    constructing: boolean | string
    selectingSubject?: string
    playgroundOpened: boolean
    playgroundChunks: Array<ChunkData>
    selectingPracticeSetData?: PracticeSetData
    actions: {
        switchEditMode: (state?: boolean) => void
        switchConstruction: (item: Store['constructing']) => void
        openPlayground: (params: {
            type: 'random' | 'practice' | 'subject' | 'chunk'
            practice?: string
            chunk?: string
        }) => void
        closePlayground: () => void
        selectSubject: (subject?: string) => void
        loadPracticeSetData: (id: string, preset?: boolean) => Promise<void>
        updateOverviewData: (data: OverviewData[]) => Promise<void>
    }
}

const initial = {
    editing: false,
    constructing: false,
    constructingChunks: [],
    playgroundOpened: false,
    playgroundChunks: [],
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
        openPlayground(params) {
            const chunks: Array<ChunkData> = []

            switch (params.type) {
                case 'practice': {
                    chunks.push(...(get().selectingPracticeSetData!.set.find(it => it.id === params.practice)?.chunks || []))
                    break
                }
                case 'chunk': {
                    const target = get()
                        .selectingPracticeSetData!.set.find(it => it.id === params.practice)
                        ?.chunks.find(it => it.id === params.chunk)
                    chunks.push(...(target ? [target] : []))
                    break
                }
                case 'subject': {
                    const selectedSubject = get().selectingSubject
                    get().selectingPracticeSetData!.set.forEach(practice => {
                        practice.chunks.forEach(chunk => {
                            if (chunk.subjects.some(it => it === selectedSubject)) {
                                chunks.push(chunk)
                            }
                        })
                    })
                    break
                }
                case 'random': {
                    const allChunks: ChunkData[] = []
                    get().selectingPracticeSetData!.set.forEach(practice => {
                        allChunks.push(...practice.chunks)
                    })
                    // 洗牌算法打乱顺序
                    for (let i = allChunks.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1))
                        ;[allChunks[i], allChunks[j]] = [allChunks[j], allChunks[i]]
                    }
                    chunks.push(...allChunks.slice(0, 10))
                    break
                }
            }

            set({ playgroundOpened: true, playgroundChunks: chunks })
        },
        closePlayground() {
            set({ playgroundOpened: false })
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
    },
}))
