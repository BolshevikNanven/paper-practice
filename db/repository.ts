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

        // --- 1. 解构 Practice ---
        practicesForDB.push({
            id: practiceId,
            practiceSetId: practiceSetId, // 关联到顶层 Set
            title: newPractice.title,
        })

        for (const chunk of newPractice.chunks) {
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

        // --- 2. 在事务中执行写入 ---
        await db.transaction(
            'rw',
            db.practiceData,
            db.chunks,
            db.chunkContent,
            db.practiceSets, // 需要包含 practiceSets 来更新时间戳
            async () => {
                // 2a. 批量添加所有新数据
                await db.practiceData.bulkAdd(practicesForDB)
                await db.chunks.bulkAdd(chunksForDB)
                await db.chunkContent.bulkAdd(contentsForDB)

                // 2b. 更新 PracticeSet 的 `updatedAt`
                await db.practiceSets.where({ id: practiceSetId }).modify({
                    updatedAt: dayjs().format('YYYY-MM-DD'),
                })
            },
        )
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
