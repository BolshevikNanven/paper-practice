import { Repository } from '@/db/repository'
import { ChunkData, PracticeData, PracticeSetData } from '@/store/interface'

import JSZip from 'jszip'

/**
 * 结构：
 * practiceSetdata/
 * ├── data.json
 * ├── {practice.id_1}/ (e.g., set-1)
 * │   ├── {chunk.id_A}
 * │   └── answer/
 * │       └── {chunk.id_A}
 * └── {practice.id_2}/ (e.g., set-2)
 *      ├── {chunk.id_B}
 *      └── answer/
 *          └── {chunk.id_B}
 * * @param data - 包含Blob的原始PracticeSetData
 */
export const Persist = {
    async exportPracticeSetAsZip(id: PracticeSetData['id']) {
        const data = await Repository.getFullPracticeSet(id)
        if (!data) {
            throw new Error('fail to load data')
        }

        const zip = new JSZip()

        const rootFolder = zip.folder('practiceSetdata')
        if (!rootFolder) {
            throw new Error('Failed to create practiceSetdata folder in zip.')
        }

        const serializableSet: PracticeData[] = []

        for (const practice of data.set) {
            const practiceMediaFolder = rootFolder.folder(practice.id)
            if (!practiceMediaFolder) {
                throw new Error(`Failed to create media folder: ${practice.id}`)
            }

            const answerFolder = practiceMediaFolder.folder('answer')
            if (!answerFolder) {
                throw new Error(`Failed to create answer folder for ${practice.id}`)
            }

            // 遍历这个 practice 的所有 chunks
            const serializableChunks: ChunkData[] = []
            for (const chunk of practice.chunks) {
                const newChunk: ChunkData = {
                    ...chunk,
                    answer: chunk.answer ? { ...chunk.answer } : undefined,
                }

                // --- 处理 Source ---
                if (newChunk.source instanceof Blob) {
                    const ext = newChunk.source.type.split('/')[1]
                    const sourceFileName = `${newChunk.id}.${ext}`

                    const relativePath = `${practice.id}/${sourceFileName}`
                    practiceMediaFolder.file(sourceFileName, newChunk.source)

                    newChunk.source = relativePath
                }

                // --- 处理 Answer ---
                if (newChunk.answer && newChunk.answer.value instanceof Blob) {
                    const ext = newChunk.answer.value.type.split('/')[1]
                    const answerFileName = `${newChunk.id}.${ext}`
                    const relativePath = `${practice.id}/answer/${answerFileName}`

                    answerFolder.file(answerFileName, newChunk.answer.value)

                    newChunk.answer.value = relativePath
                }

                serializableChunks.push(newChunk)
            }

            serializableSet.push({
                ...practice,
                chunks: serializableChunks,
            })
        }

        const finalJsonData = {
            ...data,
            set: serializableSet,
        }

        rootFolder.file('data.json', JSON.stringify(finalJsonData, null, 2))

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9,
            },
        })

        triggerDownload(zipBlob, 'practiceSetdata.zip')
    },
    async importPracticeSetFromZip(zipFile: File): Promise<PracticeSetData> {
        const zip = await JSZip.loadAsync(zipFile)

        // 1. 验证并读取 data.json
        const jsonFile = zip.file('practiceSetdata/data.json')
        if (!jsonFile) {
            throw new Error('ZIP文件无效：未找到 "practiceSetdata/data.json"。')
        }

        const jsonString = await jsonFile.async('string')
        const data: PracticeSetData = JSON.parse(jsonString)

        console.log('成功解析 data.json，正在还原 Blobs...')

        // 2. 遍历数据结构，将文件路径替换回 Blob
        // 我们使用 Promise.all 来并行处理所有文件的解压
        const newSet = await Promise.all(
            data.set.map(async practice => {
                const newChunks = await Promise.all(
                    practice.chunks.map(async chunk => {
                        const newChunk = { ...chunk } // 浅拷贝

                        // --- 还原 Source ---
                        if (typeof newChunk.source === 'string' && newChunk.source) {
                            const zipPath = `practiceSetdata/${newChunk.source}`
                            const sourceFile = zip.file(zipPath)

                            if (sourceFile) {
                                newChunk.source = await sourceFile.async('blob')
                            } else {
                                console.warn(`Source file not found in ZIP: ${zipPath}`)
                                // 保留原始字符串路径作为错误提示
                            }
                        }

                        // --- 还原 Answer ---
                        if (newChunk.answer && typeof newChunk.answer.value === 'string') {
                            const zipPath = `practiceSetdata/${newChunk.answer.value}`
                            const answerFile = zip.file(zipPath)

                            if (answerFile) {
                                // 必须复制 answer 对象才能修改
                                newChunk.answer = {
                                    ...newChunk.answer,
                                    value: await answerFile.async('blob'),
                                }
                            } else {
                                console.warn(`Answer file not found in ZIP: ${zipPath}`)
                            }
                        }

                        return newChunk
                    }),
                )

                return { ...practice, chunks: newChunks }
            }),
        )

        console.log('所有 Blobs 还原完毕。')

        // 3. 返回包含 Blob 的完整 PracticeSetData
        return { ...data, set: newSet }
    },
}

function triggerDownload(blob: Blob, filename: string) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
