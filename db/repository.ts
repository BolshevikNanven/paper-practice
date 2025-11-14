import { nanoid } from 'nanoid'
import { ChunkContentDB, ChunkDB, PracticeDataDB, PracticeSetDB } from './interface'
import { ChunkData, PracticeData, PracticeSetData } from '@/store/interface'
import { db } from '.'
import dayjs from 'dayjs'

export const Repository = {
    async addPracticeSet(practiceSet: PracticeSetData) {
        // 1. 为顶层 set 生成一个新 ID
        const newSetId = nanoid()

        // 2. 准备所有表的数据
        const setForDB: PracticeSetDB = {
            id: newSetId,
            title: practiceSet.title,
            overview: practiceSet.overview,
            updatedAt: dayjs().format('YYYY-MM-DD'),
        }

        const practicesForDB: PracticeDataDB[] = []
        const chunksForDB: ChunkDB[] = []
        const contentsForDB: ChunkContentDB[] = []

        for (const practice of practiceSet.set) {
            // 2a. 添加 PracticeData (并关联到 set)
            practicesForDB.push({
                id: practice.id,
                practiceSetId: newSetId,
                title: practice.title,
            })

            for (const chunk of practice.chunks) {
                // 2b. 添加 Chunk (并关联到 practice)
                chunksForDB.push({
                    id: chunk.id,
                    practiceDataId: practice.id,
                    subjects: chunk.subjects,
                })

                // 2c. 添加 ChunkContent (分离大文件)
                contentsForDB.push({
                    id: chunk.id,
                    source: chunk.source,
                    answer: chunk.answer,
                })
            }
        }

        // 3. 在一个事务中批量添加所有数据
        try {
            await db.transaction('rw', db.practiceSets, db.practiceData, db.chunks, db.chunkContent, async () => {
                await db.practiceSets.add(setForDB)
                await db.practiceData.bulkAdd(practicesForDB)
                await db.chunks.bulkAdd(chunksForDB)
                await db.chunkContent.bulkAdd(contentsForDB)
            })
            console.log('Practice set added successfully!')
            return newSetId
        } catch (error) {
            console.error('Failed to add practice set:', error)
        }
    },
    async getFullPracticeSet(setId: string): Promise<PracticeSetData | undefined> {
        // 1. 获取顶层 Set
        const set = await db.practiceSets.get(setId)
        if (!set) return undefined

        // 2. 获取所有关联的 PracticeData
        const practices = await db.practiceData.where({ practiceSetId: setId }).toArray()
        const practiceIds = practices.map(p => p.id)

        // 3. 获取所有关联的 Chunks (元数据)
        // 'anyOf' 效率很高
        const chunks = await db.chunks.where('practiceDataId').anyOf(practiceIds).toArray()
        const chunkIds = chunks.map(c => c.id)

        // 4. 批量获取所有 ChunkContent (大文件)
        // 'bulkGet' 是最高效的按 ID 批量获取的方式
        const contents = await db.chunkContent.bulkGet(chunkIds)

        // 5. 拼接数据 (创建 content 查找表)
        const contentMap = new Map<string, ChunkContentDB>()
        for (const content of contents) {
            if (content) {
                contentMap.set(content.id, content)
            }
        }

        // 6. 重构 PracticeData 数组
        const reconstructedSet: PracticeData[] = practices.map(p => {
            // 找到这个 practice 的所有 chunks
            const practiceChunks: ChunkData[] = chunks
                .filter(c => c.practiceDataId === p.id)
                .map(c => {
                    const content = contentMap.get(c.id)
                    // 合并 ChunkDB 和 ChunkContentDB
                    return {
                        id: c.id,
                        subjects: c.subjects,
                        source: content?.source ?? '', // 提供回退
                        answer: content?.answer,
                    }
                })

            return {
                id: p.id,
                title: p.title,
                chunks: practiceChunks,
            }
        })

        // 7. 返回完整的 PracticeSetData
        return {
            id: set.id,
            title: set.title,
            overview: set.overview,
            set: reconstructedSet,
            updatedAt: set.updatedAt,
        }
    },
    async listPracticeSets(): Promise<PracticeSetData[]> {
        const data = await db.practiceSets.toArray()

        return data.map(it => ({
            id: it.id,
            title: it.title,
            overview: [],
            set: [],
            updatedAt: it.updatedAt,
        }))
    },
    async updatePracticeSet(id: string, data: PracticeSetData): Promise<void> {
        if (data.id !== id) {
            throw new Error('PracticeSet data ID 和传入的 id 不匹配')
        }

        // 在一个事务中执行 "删除所有旧的" -> "添加所有新的" 操作
        await db.transaction(
            'rw', // 读写模式
            db.practiceSets,
            db.practiceData,
            db.chunks,
            db.chunkContent,
            async () => {
                // --- 1. 删除所有旧的子数据 ---

                // 1a. 找到所有旧的 Practice
                const oldPractices = await db.practiceData.where({ practiceSetId: id }).toArray()
                const oldPracticeIds = oldPractices.map(p => p.id)

                if (oldPracticeIds.length > 0) {
                    // 1b. 找到所有旧的 Chunk ID
                    const oldChunks = await db.chunks.where('practiceDataId').anyOf(oldPracticeIds).toArray()
                    const oldChunkIds = oldChunks.map(c => c.id)

                    // 1c. 批量删除旧的 Chunk 和 ChunkContent
                    if (oldChunkIds.length > 0) {
                        await db.chunkContent.bulkDelete(oldChunkIds)
                        await db.chunks.where('practiceDataId').anyOf(oldPracticeIds).delete()
                    }
                }

                // 1d. 删除旧的 PracticeData
                await db.practiceData.where({ practiceSetId: id }).delete()

                // --- 2. 插入所有新的数据 (解构) ---

                // 2a. 准备顶层 PracticeSet
                const setForDB: PracticeSetDB = {
                    id: data.id,
                    title: data.title,
                    overview: data.overview,
                    updatedAt: data.updatedAt,
                }

                // 2b. 准备所有子数据
                const practicesForDB: PracticeDataDB[] = []
                const chunksForDB: ChunkDB[] = []
                const contentsForDB: ChunkContentDB[] = []

                for (const practice of data.set) {
                    practicesForDB.push({
                        id: practice.id,
                        practiceSetId: data.id, // 关联到顶层 Set
                        title: practice.title,
                    })

                    for (const chunk of practice.chunks) {
                        chunksForDB.push({
                            id: chunk.id,
                            practiceDataId: practice.id, // 关联到 Practice
                            subjects: chunk.subjects,
                        })

                        // 分离大文件
                        contentsForDB.push({
                            id: chunk.id,
                            source: chunk.source,
                            answer: chunk.answer,
                        })
                    }
                }

                // --- 3. 执行写入 ---

                // 'put' = 插入或更新 (安全)
                await db.practiceSets.put(setForDB)

                // 'bulkAdd' = 批量添加 (高效)
                // 因为我们刚删除了所有旧数据，所以这里用 bulkAdd 是安全的
                await db.practiceData.bulkAdd(practicesForDB)
                await db.chunks.bulkAdd(chunksForDB)
                await db.chunkContent.bulkAdd(contentsForDB)
            },
        )
    },
}
