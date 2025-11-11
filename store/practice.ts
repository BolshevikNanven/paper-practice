import { StateCreator } from 'zustand'
import { Store } from '.'

function getMockPracticeData(): PracticeData[] {
    return Array.from({ length: 10 }).map((_, i) => ({
        id: `practice-${i + 1}`,
        title: `模拟练习 ${i + 1}`,
        chunks: Array.from({
            length: Math.floor(Math.random() * 11) + 10, // 10-20
        }).map((_, j) => ({
            id: `chunk-${j + 1}`,
            subjects: [`科目${Math.floor(Math.random() * 10)}`],
            source: '/test-practice.png',
        })),
    }))
}

export interface PracticeData {
    id: string
    title: string
    chunks: Array<ChunkData>
}

export interface ChunkData {
    id: string
    subjects: Array<string>
    source: string
}

export interface PracticeSlice {
    practiceEditing: boolean
    practiceConstructing: boolean | string
    practicePlaygroundOpened: boolean
    practicePlaygroundChunks: Array<ChunkData>
    practiceSubjectSelected?: string
    practiceData: Array<PracticeData>
    practiceActions: {
        switchEditMode: (state?: boolean) => void
        switchConstruction: (item: PracticeSlice['practiceConstructing']) => void
        openPlayground: (params: {
            type: 'random' | 'practice' | 'subject' | 'chunk'
            practice?: string
            subject?: string
            chunk?: string
        }) => void
        closePlayground: () => void
        selectSubject: (subject?: string) => void
    }
}

const initial = {
    practiceEditing: false,
    practiceConstructing: false,
    practicePlaygroundOpened: false,
    practicePlaygroundChunks: [],
    practiceSubjectSelected: undefined,
    practiceData: getMockPracticeData(),
}

export const createPracticeSlice: StateCreator<Store, [], [], PracticeSlice> = (set, get) => ({
    ...initial,
    practiceActions: {
        switchEditMode(state) {
            set({
                practiceEditing: state || !get().practiceEditing,
            })
        },
        switchConstruction(item) {
            set({ practiceConstructing: item })
        },
        openPlayground(params) {
            const chunks: Array<ChunkData> = []

            switch (params.type) {
                case 'practice': {
                    chunks.push(...(get().practiceData.find(it => it.id === params.practice)?.chunks || []))
                    console.log(chunks)

                    break
                }
                case 'chunk': {
                    const target = get()
                        .practiceData.find(it => it.id === params.practice)
                        ?.chunks.find(it => it.id === params.chunk)
                    chunks.push(...(target ? [target] : []))
                }
            }

            set({ practicePlaygroundOpened: true, practicePlaygroundChunks: chunks })
        },
        closePlayground() {
            set({ practicePlaygroundOpened: false })
        },
        selectSubject(subject) {
            set({ practiceSubjectSelected: subject })
        },
    },
})
