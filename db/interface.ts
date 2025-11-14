import { OverviewData } from '@/store/interface'

export interface PracticeSetDB {
    id: string
    title: string
    overview: Array<OverviewData>
    updatedAt: string
}

export interface PracticeDataDB {
    id: string
    practiceSetId: string
    title: string
}

export interface ChunkDB {
    id: string
    practiceDataId: string
    subjects: string[]
}

export interface ChunkContentDB {
    id: string
    source: string | Blob
    answer?: {
        type: 'pic' | 'text'
        value: string | Blob
    }
}
