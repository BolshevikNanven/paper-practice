import ImageRenderer from '@/components/common/image-renderer'
import {
    useState,
    useRef,
    useLayoutEffect,
    useCallback,
    useMemo,
    ReactElement,
    CSSProperties,
    RefObject,
    ComponentType,
} from 'react'

// --- 布局常量定义 ---

/** 用于计算的布局常量 */
export interface LayoutConstants {
    /** 非内容区域的高度 (例如：标题) (单位: px) */
    titleHeight: number
    /** 卡片的底部内边距 (padding-bottom) (单位: px) */
    cardPaddingBottom: number
    /** 卡片的最大宽度 (单位: px) */
    maxWidth: number
}

/** `useUniformCardWidth` hook 的 Props */
export interface UseUniformCardWidthProps<TData, TChunk> {
    /** 用于渲染卡片的数据数组 */
    data: TData[]
    /** 从每个数据项中提取唯一 key 的函数 */
    itemKeyExtractor: (item: TData) => string
    /** 从每个数据项中提取 "chunks" (例如：图片) 数组的函数 */
    chunksExtractor: (item: TData) => TChunk[]
    /** 从每个 "chunk" 中提取图片 `src` 的函数 */
    chunkSourceExtractor: (chunk: TChunk) => string | Blob
    /** 用于计算的布局常量对象 */
    layoutConstants: LayoutConstants
}

/** `useUniformCardWidth` hook 的返回值 */
export interface UseUniformCardWidthReturn {
    /** 你应该附加到主滚动容器 (例如: RailScroller) 的 ref */
    containerRef: RefObject<HTMLDivElement>
    /** * 计算出的最终统一宽度 (单位: px)。
     * 在计算完成前为 `null`。
     */
    finalWidth: number | null
    /** * 包含"测量室"的 JSX 元素。
     * [!!] 你必须在你的组件中渲染它。
     */
    measuringRoom: ReactElement
    /** 一个布尔值，当宽度正在计算时为 `true` */
    isCalculating: boolean
}

/** 用于隐藏的"测量室"的 CSS 样式 */
const measuringRoomStyles: CSSProperties = {
    position: 'fixed',
    visibility: 'hidden',
    zIndex: -100,
    top: 0,
    left: 0,
    pointerEvents: 'none',
}

/**
 * 一个 React Hook，用于为垂直卡片列表计算统一的宽度。
 * 它通过确保"最高"的卡片刚好适合给定的容器高度来计算宽度。
 */
export function useUniformCardWidth<TData, TChunk>({
    data,
    itemKeyExtractor,
    chunksExtractor,
    chunkSourceExtractor,
    layoutConstants,
}: UseUniformCardWidthProps<TData, TChunk>): UseUniformCardWidthReturn {
    // 存储所有卡片高宽比的 Map (key: item.id, value: aspectRatio)
    const [aspectRatios, setAspectRatios] = useState<Map<string, number>>(new Map())
    // 存储容器高度
    const [containerHeight, setContainerHeight] = useState(0)
    // 存储最终计算出的宽度
    const [finalWidth, setFinalWidth] = useState<number | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    // 1. 创建一个稳定的回调函数来收集测量结果
    const handleMeasure = useCallback((id: string, aspectRatio: number) => {
        setAspectRatios(prevMap => {
            // 仅当值发生变化时才更新 state，以避免不必要的重渲染
            if (prevMap.get(id) === aspectRatio) return prevMap

            const newMap = new Map(prevMap)
            newMap.set(id, aspectRatio)
            return newMap
        })
    }, [])

    const Measurer = useMemo(() => {
        const InternalMeasurer: React.FC<{
            item: TData
            onMeasured: (id: string, ratio: number) => void
        }> = ({ item, onMeasured }) => {
            const ref = useRef<HTMLDivElement>(null)
            const key = itemKeyExtractor(item)
            const chunks = chunksExtractor(item)
            const totalChunks = chunks.length

            const [loadedCount, setLoadedCount] = useState(0)

            const onMeasuredRef = useRef(onMeasured)
            onMeasuredRef.current = onMeasured
            const keyRef = useRef(key)
            keyRef.current = key

            const handleImageLoadOrError = useCallback(() => {
                setLoadedCount(c => c + 1)
            }, [])

            useLayoutEffect(() => {
                // 当所有图片都"加载"(或失败)时，并且 ref 存在
                if (loadedCount === totalChunks && totalChunks > 0 && ref.current) {
                    const measuredWidth = ref.current.clientWidth
                    const measuredHeight = ref.current.scrollHeight

                    if (measuredHeight > 0) {
                        onMeasuredRef.current(keyRef.current, measuredWidth / measuredHeight)
                    } else {
                        onMeasuredRef.current(keyRef.current, Infinity)
                    }
                } else if (totalChunks === 0) {
                    // [!!] 处理没有图片的情况
                    onMeasuredRef.current(keyRef.current, Infinity)
                }
            }, [loadedCount, totalChunks])

            return (
                <div ref={ref} style={{ width: `${layoutConstants.maxWidth}px` }}>
                    {chunks.map((chunk, idx) => (
                        <div key={idx} className='w-full'>
                            <ImageRenderer
                                src={chunkSourceExtractor(chunk)}
                                alt={`measure-${idx}`}
                                className='h-auto w-full'
                                onLoad={handleImageLoadOrError}
                                onError={handleImageLoadOrError}
                            />
                        </div>
                    ))}
                </div>
            )
        }
        return InternalMeasurer
    }, [chunkSourceExtractor, chunksExtractor, itemKeyExtractor, layoutConstants.maxWidth])

    // 3. 创建 memoized "测量室" JSX 元素
    const measuringRoom = useMemo(
        () =>
            finalWidth === null ? (
                <div style={measuringRoomStyles}>
                    {data.map(item => (
                        <Measurer key={itemKeyExtractor(item)} item={item} onMeasured={handleMeasure} />
                    ))}
                </div>
            ) : (
                <></>
            ),
        [finalWidth, data, Measurer, itemKeyExtractor, handleMeasure],
    )

    // 4. 测量容器的高度
    useLayoutEffect(() => {
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight)
        }
        // 注意: 你可能想在这里添加一个 ResizeObserver
        // 来处理窗口大小变化并重新测量
    }, [containerRef])

    // 5. 计算最终宽度
    useLayoutEffect(() => {
        // 确保我们有容器高度，并且所有卡片都已测量完毕
        const allMeasured = aspectRatios.size === data.length && data.length > 0

        if (containerHeight > 0 && allMeasured) {
            // 找到所有卡片中最小的高宽比 (即 "最长" 的卡片)
            const minAspectRatio = Math.min(...Array.from(aspectRatios.values()))

            if (minAspectRatio === Infinity) {
                setFinalWidth(layoutConstants.maxWidth) // 回退
                return
            }

            // 计算图片容器可用的垂直空间
            const imageContainerHeight = containerHeight - layoutConstants.titleHeight - layoutConstants.cardPaddingBottom

            

            if (imageContainerHeight <= 0) {
                setFinalWidth(layoutConstants.maxWidth) // 回退
                return
            }

            // 计算理想宽度：宽度 = 可用高度 * 高宽比
            const calculatedWidth = imageContainerHeight * minAspectRatio

            // 最终宽度是计算值和最大宽度中的较小者
            setFinalWidth(Math.min(calculatedWidth, layoutConstants.maxWidth))
        }
    }, [containerHeight, aspectRatios, data.length, layoutConstants])

    return {
        containerRef: containerRef as RefObject<HTMLDivElement>,
        finalWidth,
        measuringRoom,
        isCalculating: finalWidth === null,
    }
}
