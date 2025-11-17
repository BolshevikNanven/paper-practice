export interface WorkerRequest {
    id: string
    image: Blob
}

export interface WorkerResponse {
    id: string
    status: 'success' | 'error'
    output?: {
        label: string
        score: number
        box: number[]
    }[]
    error?: string
    origin?: {
        w: number
        h: number
    }
}
