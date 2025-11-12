import { create } from 'zustand'

function getMockData(): PracticeData[] {
    return Array.from({ length: 10 }).map((_, i) => ({
        id: `practice-${i + 1}`,
        title: `模拟练习 ${i + 1}`,
        chunks: Array.from({
            length: Math.floor(Math.random() * 11) + 10, // 10-20
        }).map((_, j) => ({
            id: `chunk-${j + 1}`,
            subjects: [`科目${Math.floor(Math.random() * 10)}`],
            source: '/test-practice.png',
            answer: {
                type: 'text',
                value: '答案',
            },
        })),
    }))
}

const mockOverviewData = [
    {
        title: '数列敛散性的判定',
        children: [{ title: '子目录1' }, { title: '子目录2', children: [{ title: '科目2' }] }],
    },
    { title: '极限存在性' },
    { title: '函数连续性', children: [{ title: '科目1' }] },
]

export interface PracticeData {
    id: string
    title: string
    chunks: Array<ChunkData>
}

export interface ChunkData {
    id: string
    subjects: Array<string>
    source: string
    answer?: {
        type: 'pic' | 'text'
        value: string
    }
}

export interface OverviewData {
    title: string
    children?: Array<OverviewData>
}

interface Store {
    editing: boolean
    constructing: boolean | string
    constructingChunks: Array<ChunkData>
    selectingSubject?: string
    overviewData: Array<OverviewData> | null
    playgroundOpened: boolean
    playgroundChunks: Array<ChunkData>
    data: Array<PracticeData>
    actions: {
        switchEditMode: (state?: boolean) => void
        switchConstruction: (item: Store['constructing']) => void
        setConstructionChunks: (item: Array<ChunkData>) => void
        openPlayground: (params: {
            type: 'random' | 'practice' | 'subject' | 'chunk'
            practice?: string
            chunk?: string
        }) => void
        closePlayground: () => void
        selectSubject: (subject?: string) => void
    }
}

const initial = {
    editing: false,
    constructing: false,
    constructingChunks: [],
    playgroundOpened: false,
    playgroundChunks: [],
    overviewData: mockOverviewData,
    subjectSelected: undefined,
    data: getMockData(),
}

export const usePracticeStore = create<Store>()((set, get) => ({
    ...initial,
    actions: {
        switchEditMode(state) {
            set({
                editing: state || !get().editing,
            })
        },
        switchConstruction(item) {
            set({ constructing: item, constructingChunks: [] })
        },
        setConstructionChunks(item) {
            set({ constructingChunks: item })
        },
        openPlayground(params) {
            const chunks: Array<ChunkData> = []

            switch (params.type) {
                case 'practice': {
                    chunks.push(...(get().data.find(it => it.id === params.practice)?.chunks || []))
                    break
                }
                case 'chunk': {
                    const target = get()
                        .data.find(it => it.id === params.practice)
                        ?.chunks.find(it => it.id === params.chunk)
                    chunks.push(...(target ? [target] : []))
                    break
                }
                case 'subject': {
                    const selectedSubject = get().selectingSubject
                    get().data.forEach(practice => {
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
                    get().data.forEach(practice => {
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
    },
}))
