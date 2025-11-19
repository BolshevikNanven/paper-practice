export interface WorkerRequest {
    id: string
    image: Blob
}

export interface WorkerOutput {
    label: string
    score: number
    box: number[]
}

export type WorkerResponse =
    | {
          status: 'success'
          id: string
          output: WorkerOutput[]
          origin: { w: number; h: number }
      }
    | {
          status: 'error'
          id: string
          error: string
      }
    | {
          status: 'progress'
          id: string
          file: string
          progress: number
      }
