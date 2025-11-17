import { nanoid } from 'nanoid'
import { ChunkContentDB, ChunkDB, PracticeDataDB, PracticeSetDB } from './interface'
import { ChunkData, OverviewData, PracticeData, PracticeSetData } from '@/store/interface'
import { db } from '.'
import dayjs from 'dayjs'

export const Repository = {
    async createPracticeSet(title: string) {
        // 1. 为顶层 set 生成一个新 ID
        const newSetId = nanoid()

        // 2. 准备所有表的数据
        const setForDB: PracticeSetDB = {
            id: newSetId,
            title: title,
            overview: [],
            updatedAt: dayjs().format('YYYY-MM-DD'),
        }

        try {
            await db.transaction('rw', db.practiceSets, db.practiceData, db.chunks, db.chunkContent, async () => {
                await db.practiceSets.add(setForDB)
            })
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
        const allChunks = await db.chunks.where('practiceDataId').anyOf(practiceIds).toArray()

        // 3b. 批量获取所有 ChunkContent (大文件)
        //     (我们直接用 allChunks 的 id 列表，比你之前的 chunkIds 更直接)
        const allContents = await db.chunkContent.bulkGet(allChunks.map(c => c.id))

        // 3c. 拼接数据 (创建 content 查找表)
        const contentMap = new Map<string, ChunkContentDB>()
        for (const content of allContents) {
            if (content) {
                contentMap.set(content.id, content)
            }
        }

        // 3d. (新) 创建 Chunk 元数据查找表，用于按 ID 快速查找
        const chunkMetaMap = new Map<string, ChunkDB>()
        for (const chunk of allChunks) {
            chunkMetaMap.set(chunk.id, chunk)
        }

        // --- 4. (已重构) 重构 PracticeData 数组 (处理新旧数据) ---
        const reconstructedSet: PracticeData[] = practices.map(p_db => {
            const practice = p_db
            const practiceChunks: ChunkData[] = []

            for (const chunkId of practice.chunkOrder) {
                const meta = chunkMetaMap.get(chunkId)
                const content = contentMap.get(chunkId)

                if (meta && content) {
                    practiceChunks.push({
                        id: meta.id,
                        subjects: meta.subjects,
                        source: content.source,
                        answer: content.answer,
                    })
                }
            }

            return {
                id: practice.id,
                title: practice.title,
                chunks: practiceChunks, // <-- 数组现在是有序的 (如果是新数据)
            }
        })

        // 5. 返回完整的 PracticeSetData (无变化)
        return {
            id: set.id,
            title: set.title,
            overview: set.overview,
            set: reconstructedSet,
            updatedAt: set.updatedAt, // <-- 确保你的类型包含这个
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
    /**
     * 向一个 PracticeSet 添加一个新的 Practice
     *
     * 此方法是事务性的，会同时添加 PracticeData, Chunks,
     * 和 ChunkContent，并更新 PracticeSet 的 `updatedAt`。
     */
    async createPractice(practiceSetId: string, newPractice: PracticeData): Promise<void> {
        const practicesForDB: PracticeDataDB[] = []
        const chunksForDB: ChunkDB[] = []
        const contentsForDB: ChunkContentDB[] = []

        const practiceId = nanoid()

        // 1a. 提取所有 chunk ID，保持原始顺序
        const chunkOrder = newPractice.chunks.map(chunk => chunk.id)

        practicesForDB.push({
            id: practiceId,
            practiceSetId: practiceSetId,
            title: newPractice.title,
            chunkOrder: chunkOrder,
        })

        for (const chunk of newPractice.chunks) {
            // ... 这部分代码保持不变 ...
            chunksForDB.push({
                id: chunk.id,
                practiceDataId: practiceId,
                subjects: chunk.subjects,
            })

            contentsForDB.push({
                id: chunk.id,
                source: chunk.source,
                answer: chunk.answer,
            })
        }

        // --- 2. 在事务中执行写入 ---
        await db.transaction('rw', db.practiceData, db.chunks, db.chunkContent, db.practiceSets, async () => {
            await db.practiceData.add(practicesForDB[0])

            await db.chunks.bulkAdd(chunksForDB)
            await db.chunkContent.bulkAdd(contentsForDB)

            await db.practiceSets.where({ id: practiceSetId }).modify({
                updatedAt: dayjs().format('YYYY-MM-DD'),
            })
        })
    },
    /**
     * 删除一个 Practice (及其所有子数据)
     *
     * 此方法是事务性的，会自下而上地删除：
     * 1. ChunkContent
     * 2. Chunks
     * 3. PracticeData
     * 然后更新 PracticeSet 的 `updatedAt`。
     */
    async deletePractice(practiceId: string): Promise<void> {
        // 我们需要先获取 practice 来找到它的 parentSetId
        const practice = await db.practiceData.get(practiceId)
        if (!practice) {
            console.warn(`删除失败：未找到 ID 为 ${practiceId} 的 Practice`)
            return // 如果不存在，则静默失败
        }
        const practiceSetId = practice.practiceSetId

        await db.transaction('rw', db.practiceData, db.chunks, db.chunkContent, db.practiceSets, async () => {
            // --- 1. 找到所有旧的 Chunk ID ---
            const oldChunks = await db.chunks.where({ practiceDataId: practiceId }).toArray()
            const oldChunkIds = oldChunks.map(c => c.id)

            // --- 2. 自下而上删除 ---
            // 2a. 删除 ChunkContent
            if (oldChunkIds.length > 0) {
                await db.chunkContent.bulkDelete(oldChunkIds)
            }
            // 2b. 删除 Chunks
            await db.chunks.where({ practiceDataId: practiceId }).delete()
            // 2c. 删除 PracticeData
            await db.practiceData.delete(practiceId)

            // --- 3. 更新 PracticeSet 的 `updatedAt` ---
            await db.practiceSets.where({ id: practiceSetId }).modify({
                updatedAt: dayjs().format('YYYY-MM-DD'),
            })
        })
    },
    /**
     * 更新一个已有的 Practice
     *
     * 此方法会：
     * 1. 更新 PracticeData 的 title
     * 2. 删除所有旧的 Chunks/ChunkContent
     * 3. 添加所有新的 Chunks/ChunkContent
     * 4. 更新 PracticeSet 的 `updatedAt`
     */
    async updatePractice(practiceId: string, updatedPractice: PracticeData): Promise<void> {
        // 验证 ID 是否匹配
        if (practiceId !== updatedPractice.id) {
            throw new Error('Practice ID 不匹配')
        }

        const practice = await db.practiceData.get(practiceId)
        if (!practice) {
            throw new Error(`更新失败：未找到 ID 为 ${practiceId} 的 Practice`)
        }
        const practiceSetId = practice.practiceSetId

        // --- 准备新的子数据 ---
        const chunksForDB: ChunkDB[] = []
        const contentsForDB: ChunkContentDB[] = []

        for (const chunk of updatedPractice.chunks) {
            chunksForDB.push({
                id: chunk.id,
                practiceDataId: practiceId, // 关联到 Practice
                subjects: chunk.subjects,
            })
            contentsForDB.push({
                id: chunk.id,
                source: chunk.source,
                answer: chunk.answer,
            })
        }

        // --- 在事务中执行 "删-改-增" ---
        await db.transaction('rw', db.practiceData, db.chunks, db.chunkContent, db.practiceSets, async () => {
            // --- 1. 删除所有旧的子数据 ---
            const oldChunks = await db.chunks.where({ practiceDataId: practiceId }).toArray()
            const oldChunkIds = oldChunks.map(c => c.id)
            if (oldChunkIds.length > 0) {
                await db.chunkContent.bulkDelete(oldChunkIds)
            }
            await db.chunks.where({ practiceDataId: practiceId }).delete()

            // --- 2. 更新 PracticeData 本身 (例如 title) ---
            await db.practiceData.update(practiceId, {
                title: updatedPractice.title,
            })

            // --- 3. 添加所有新的子数据 ---
            await db.chunks.bulkAdd(chunksForDB)
            await db.chunkContent.bulkAdd(contentsForDB)

            // --- 4. 更新 PracticeSet 的 `updatedAt` ---
            await db.practiceSets.where({ id: practiceSetId }).modify({
                updatedAt: dayjs().format('YYYY-MM-DD'),
            })
        })
    },
    async updatePracticeSetMeta(id: string, changes: { title?: string; overview?: OverviewData[] }): Promise<void> {
        const modifications: Partial<PracticeSetDB> = {
            ...changes,
            updatedAt: dayjs().format('YYYY-MM-DD'), // 自动更新时间戳
        }

        //@ts-expect-error: 循环引用报错
        const count = await db.practiceSets.where({ id: id }).modify(modifications)

        if (count === 0) {
            throw new Error(`更新失败：未找到 ID 为 ${id} 的 PracticeSet`)
        }
    },
    async deletePracticeSet(id: string): Promise<void> {
        await db.transaction(
            'rw', // 读写模式
            db.practiceSets,
            db.practiceData,
            db.chunks,
            db.chunkContent,
            async () => {
                // --- 1. 找到所有关联的 PracticeData ---
                const oldPractices = await db.practiceData.where({ practiceSetId: id }).toArray()
                const oldPracticeIds = oldPractices.map(p => p.id)

                // --- 2. 找到所有关联的 Chunks 和 Content ---
                if (oldPracticeIds.length > 0) {
                    // 2a. 找到所有 Chunks
                    const oldChunks = await db.chunks.where('practiceDataId').anyOf(oldPracticeIds).toArray()
                    const oldChunkIds = oldChunks.map(c => c.id)

                    // 2b. 删除所有关联的 ChunkContent
                    if (oldChunkIds.length > 0) {
                        await db.chunkContent.bulkDelete(oldChunkIds)
                    }

                    // 2c. 删除所有关联的 Chunks
                    await db.chunks.where('practiceDataId').anyOf(oldPracticeIds).delete()
                }

                // --- 3. 删除所有关联的 PracticeData ---
                await db.practiceData.where({ practiceSetId: id }).delete()

                // --- 4. 删除顶层的 PracticeSet ---
                await db.practiceSets.delete(id)
            },
        )
    },
}
