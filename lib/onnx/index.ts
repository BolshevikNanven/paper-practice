import { nanoid } from 'nanoid'
import type { WorkerOutput, WorkerRequest, WorkerResponse } from './interface'

const CONCURRENCY = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4

interface Task {
    id: string
    file: File | Blob
    resolve: (value: AnalyzeResult) => void
    reject: (reason?: Error) => void
    onProgress?: (progress: number, file: string) => void
}
type AnalyzeResult = {
    origin: { w: number; h: number }
    output: WorkerOutput[]
}

const workers: Worker[] = []
const idleWorkerIndices: number[] = []
const taskQueue: Task[] = []
const pendingMap = new Map<string, Omit<Task, 'id' | 'file'>>()
let isInitialized = false

function initWorkers() {
    if (isInitialized) return
    if (typeof window === 'undefined') return
    for (let i = 0; i < CONCURRENCY; i++) {
        const worker = new Worker(new URL('./worker.ts', import.meta.url), {
            type: 'module',
        })

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const data = event.data
            // 注意：这里不要直接解构 { status, origin... }，因为 progress 类型的字段不同

            const request = pendingMap.get(data.id)
            if (!request) return

            // ✨ 处理进度消息
            if (data.status === 'progress') {
                // 如果用户传了回调，就调用它
                if (request.onProgress) {
                    request.onProgress(data.progress, data.file)
                }
                return // ⚠️ 关键：如果是进度消息，直接 return，不要 resolve 也不要 recycleWorker
            }

            // 处理完成或错误
            if (data.status === 'success') {
                request.resolve({ origin: data.origin!, output: data.output! })
            } else {
                request.reject(new Error(data.error))
            }

            pendingMap.delete(data.id)
            recycleWorker(i)
        }

        workers.push(worker)
        idleWorkerIndices.push(i)
    }
    isInitialized = true
}

function processQueue() {
    if (idleWorkerIndices.length === 0 || taskQueue.length === 0) {
        return
    }

    const workerIndex = idleWorkerIndices.pop()!
    const worker = workers[workerIndex]

    const task = taskQueue.shift()!

    if (task && worker) {
        pendingMap.set(task.id, { resolve: task.resolve, reject: task.reject, onProgress: task.onProgress })

        const request: WorkerRequest = { id: task.id, image: task.file }
        worker.postMessage(request)
    }
}

function recycleWorker(workerIndex: number) {
    idleWorkerIndices.push(workerIndex)
    processQueue()
}

export async function analyzePaperLayout(
    file: File | Blob,
    onProgress?: (progress: number, file: string) => void,
): Promise<AnalyzeResult> {
    initWorkers()
    const id = nanoid()

    return new Promise((resolve, reject) => {
        const task: Task = {
            id,
            file,
            resolve,
            reject,
            onProgress,
        }

        taskQueue.push(task)
        processQueue()
    })
}
