import { nanoid } from 'nanoid'
import type { WorkerRequest, WorkerResponse } from './interface'

const CONCURRENCY = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4

interface Task {
    id: string
    file: File | Blob
    resolve: (value: AnalyzeResult) => void
    reject: (reason?: Error) => void
}
type AnalyzeResult = {
    origin: WorkerResponse['origin']
    output: WorkerResponse['output']
}

const workers: Worker[] = []
const idleWorkerIndices: number[] = []
const taskQueue: Task[] = []
const pendingMap = new Map<string, { resolve: (res: AnalyzeResult) => void; reject: (err: Error) => void }>()
let isInitialized = false

function initWorkers() {
    if (isInitialized) return
    if (typeof window === 'undefined') return
    for (let i = 0; i < CONCURRENCY; i++) {
        const worker = new Worker(new URL('./worker.ts', import.meta.url), {
            type: 'module',
        })

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { id, status, origin, output, error } = event.data

            const request = pendingMap.get(id)

            // 1. 处理 Promise 结果
            if (request) {
                if (status === 'success') {
                    request.resolve({ origin, output })
                } else {
                    request.reject(new Error(error))
                }
                pendingMap.delete(id)
            }

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
        pendingMap.set(task.id, { resolve: task.resolve, reject: task.reject })

        const request: WorkerRequest = { id: task.id, image: task.file }
        worker.postMessage(request)
    }
}

function recycleWorker(workerIndex: number) {
    idleWorkerIndices.push(workerIndex)
    processQueue()
}

export async function analyzePaperLayout(file: File | Blob): Promise<AnalyzeResult> {
    initWorkers()
    const id = nanoid()

    return new Promise((resolve, reject) => {
        const task: Task = {
            id,
            file,
            resolve,
            reject,
        }

        taskQueue.push(task)
        processQueue()
    })
}
