import { PlaygroundContext } from '@/components/common/playground'
import { ChunkData } from '@/store/interface'
import { usePracticeStore } from '@/store/practice'
import { useContext } from 'react'

type RandomParams = {
    type: 'random'
}

type SubjectParams = {
    type: 'subject'
}

type ChunkParams = {
    type: 'chunks'
    chunks: ChunkData[]
}

type GetChunksParams = RandomParams | SubjectParams | ChunkParams

export function usePlayground() {
    const context = useContext(PlaygroundContext)
    if (!context) {
        throw new Error('useDialog must be used within a ConfirmDialogProvider')
    }

    return (params: GetChunksParams) => {
        const chunks: Array<ChunkData> = []

        const data = usePracticeStore.getState()

        switch (params.type) {
            case 'chunks': {
                chunks.push(...params.chunks)
                break
            }
            case 'subject': {
                const selectedSubject = data.selectingSubject
                data.selectingPracticeSetData!.set.forEach(practice => {
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
                data.selectingPracticeSetData!.set.forEach(practice => {
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

        context.open(chunks)
    }
}
