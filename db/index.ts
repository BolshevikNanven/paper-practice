import Dexie, { Table } from 'dexie'
import { ChunkContentDB, ChunkDB, PracticeDataDB, PracticeSetDB } from './interface'

class DB extends Dexie {
    practiceSets!: Table<PracticeSetDB, string>
    practiceData!: Table<PracticeDataDB, string>
    chunks!: Table<ChunkDB, string>
    chunkContent!: Table<ChunkContentDB, string>

    constructor() {
        super('PracticeDatabase')
        this.version(1).stores({
            practiceSets: [
                'id', // 主键
                'title', // 索引, 用于按标题搜索
                'updatedAt',
            ].join(','),

            practiceData: [
                'id', // 主键
                'practiceSetId', // 索引, 用于获取一个 set 下的所有 practice
                'title',
            ].join(','),

            chunks: [
                'id', // 主键
                'practiceDataId', // 索引, 用于获取一个 practice 下的所有 chunk
                '*subjects', // 多条目索引, 用于按 subject 搜索
            ].join(','),

            chunkContent: [
                'id', // 主键 (与 chunks.id 1:1 对应)
            ].join(','),
        })
    }
}

export const db = new DB()
