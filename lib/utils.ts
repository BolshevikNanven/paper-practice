import { PracticeNode } from '@/components/practice/subject'
import { OverviewData } from '@/store/practice'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function flattenSubjectsTree(nodes: Array<OverviewData>, deep = 0) {
    let result: Array<PracticeNode> = []
    for (const node of nodes) {
        result.push({ ...node, deep })
        if (node.children) {
            result = result.concat(flattenSubjectsTree(node.children, deep + 1))
        }
    }
    return result
}

export function deepClone<T>(source: T): T {
    const cache = new WeakMap<object, unknown>()

    function deepCopyRecursive<T>(source: T, cache: WeakMap<object, unknown>): T {
        // 1. 基本类型 和 null (typeof null === 'object')
        // string, number, boolean, symbol, undefined, bigint, function
        if (source === null || typeof source !== 'object') {
            return source
        }

        // 2. 检查缓存，处理循环引用
        // 此时 'source' 必定是 'object'
        if (cache.has(source)) {
            // 我们已经拷贝过这个对象了，直接返回缓存中的拷贝
            return cache.get(source) as T
        }

        // 3. 处理特定的对象类型

        // 3.1 处理 Date
        if (source instanceof Date) {
            const newDate = new Date(source.getTime())
            cache.set(source, newDate) // 存入缓存
            return newDate as T
        }

        // 3.2 处理 RegExp
        if (source instanceof RegExp) {
            const newRegExp = new RegExp(source.source, source.flags)
            cache.set(source, newRegExp) // 存入缓存
            return newRegExp as T
        }

        // 3.3 处理 Set
        if (source instanceof Set) {
            // 此时 source 是 Set<unknown>
            const newSet = new Set<unknown>()
            cache.set(source, newSet) // *立即*存入缓存，以处理 Set 内部的循环引用

            source.forEach(value => {
                newSet.add(deepCopyRecursive(value, cache))
            })

            return newSet as T
        }

        // 3.4 处理 Map
        if (source instanceof Map) {
            // 此时 source 是 Map<unknown, unknown>
            const newMap = new Map<unknown, unknown>()
            cache.set(source, newMap) // *立即*存入缓存，以处理 Map 内部的循环引用

            source.forEach((value, key) => {
                const newKey = deepCopyRecursive(key, cache)
                const newValue = deepCopyRecursive(value, cache)
                newMap.set(newKey, newValue)
            })

            return newMap as T
        }

        // 3.5 处理 Array
        if (Array.isArray(source)) {
            // 此时 source 是 unknown[]
            const newArray: unknown[] = []
            cache.set(source, newArray) // *立即*存入缓存，以处理数组内的循环引用

            for (let i = 0; i < source.length; i++) {
                newArray[i] = deepCopyRecursive(source[i], cache)
            }

            return newArray as T
        }

        // 3.6 处理 Plain Object (普通对象)
        // 使用 Object.create 来保留原型链
        const newObject = Object.create(Object.getPrototypeOf(source))

        cache.set(source, newObject) // *立即*存入缓存，以处理对象属性间的循环引用

        // 使用 Reflect.ownKeys 来拷贝所有属性 (包括 Symbol 和不可枚举属性)
        // 我们将 'source' 视为一个 Record，以便安全地索引
        const sourceAsRecord = source as Record<string | symbol, unknown>

        for (const key of Reflect.ownKeys(source)) {
            newObject[key] = deepCopyRecursive(sourceAsRecord[key], cache)
        }

        return newObject as T
    }
    return deepCopyRecursive(source, cache)
}
