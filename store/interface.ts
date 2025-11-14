export interface PresetPracticeMapData {
    id: string
    title: string
    updatedAt: string
}

export interface PracticeSetData {
    id: string
    title: string
    overview: Array<OverviewData>
    set: Array<PracticeData>
    updatedAt: string
}

export interface PracticeData {
    id: string
    title: string
    chunks: Array<ChunkData>
}

export interface ChunkData {
    id: string
    subjects: Array<string>
    source: string | Blob
    answer?: {
        type: 'pic' | 'text'
        value: string | Blob
    }
}

export interface OverviewData {
    title: string
    children?: Array<OverviewData>
}
