import { cn } from '@/lib/utils'
import { ClassValue } from 'clsx'
import React, { useRef, useEffect, useState, useCallback, ReactNode } from 'react'

// --- 组件 Props 类型定义 ---
interface RailScrollerProps {
    /** * 要水平滚动的子元素。
     * 可以是一个或多个元素。
     * 如果是单个元素，请确保它有能力（例如，通过设置width）来溢出容器。
     */
    children: ReactNode
    className?: ClassValue
}

/**
 * RailScroller 组件
 * 当子元素横向溢出时，显示一个纵向滚动条。
 * 无论是滚动鼠标滚轮还是拖动此纵向滚动条，都会导致内容横向滚动。
 * 它会自动检测子元素和容器的尺寸变化。
 */
export const RailScroller: React.FC<RailScrollerProps> = ({ className, children }) => {
    const wrapperRef = useRef<HTMLDivElement>(null) // 内容视口
    const contentRef = useRef<HTMLDivElement>(null) // 实际内容 (children的包装器)
    const trackRef = useRef<HTMLDivElement>(null) // 滚动条轨道
    const thumbRef = useRef<HTMLDivElement>(null) // 滚动条滑块

    // --- 内部状态和 Ref ---
    // 用于在 document 事件中保持最新状态的 Ref
    const isDraggingRef = useRef<boolean>(false)
    const startDragDataRef = useRef<{ startY: number; startThumbTop: number }>({ startY: 0, startThumbTop: 0 })
    const dimensionsRef = useRef<{ maxContentScroll: number; maxThumbScroll: number }>({
        maxContentScroll: 0,
        maxThumbScroll: 0,
    })

    // 状态：控制滚动条是否可见 (用于条件渲染)
    const [isScrollbarVisible, setIsScrollbarVisible] = useState<boolean>(false)
    // 状态：控制滑块的拖动样式 (用于 Tailwind 类)
    const [isDragging, setIsDragging] = useState<boolean>(false)

    // --- 1. 同步功能 (使用 useCallback 优化) ---

    /**
     * 同步内容 -> 滑块
     * 根据内容的 scrollLeft 来设置滑块的 top
     */
    const syncThumbFromContent = useCallback(() => {
        const wrapper = wrapperRef.current
        const thumb = thumbRef.current
        if (!wrapper || !thumb) return

        const { maxContentScroll, maxThumbScroll } = dimensionsRef.current
        if (maxContentScroll === 0) {
            // 防止除以 0
            thumb.style.top = '0px'
            return
        }

        const newThumbTop = (wrapper.scrollLeft / maxContentScroll) * maxThumbScroll
        thumb.style.top = `${newThumbTop}px`
    }, [])

    /**
     * 同步滑块 -> 内容
     * 根据滑块的 top 来设置内容的 scrollLeft
     */
    const syncContentFromThumb = useCallback(() => {
        const wrapper = wrapperRef.current
        const thumb = thumbRef.current
        if (!wrapper || !thumb) return

        const { maxContentScroll, maxThumbScroll } = dimensionsRef.current
        if (maxThumbScroll === 0) return

        const currentThumbTop = parseFloat(thumb.style.top || '0')
        const newScrollLeft = (currentThumbTop / maxThumbScroll) * maxContentScroll
        wrapper.scrollLeft = newScrollLeft
    }, [])

    // --- 2. 关键功能：尺寸计算 (自动响应变化) ---

    /**
     * 重新计算所有关键尺寸。
     * 这个函数会被 ResizeObserver 调用。
     */
    const updateDimensions = useCallback(() => {
        const wrapper = wrapperRef.current
        const content = contentRef.current
        if (!wrapper || !content) return // 确保元素已挂载

        const contentScrollWidth = content.scrollWidth
        const contentClientWidth = wrapper.clientWidth

        // A. 检查是否需要滚动条
        const needsScrollbar = contentScrollWidth > contentClientWidth
        setIsScrollbarVisible(needsScrollbar)

        // 如果滚动条不可见，我们不需要计算轨道和滑块
        // 确保轨道和滑块的引用也存在
        const track = trackRef.current
        const thumb = thumbRef.current

        if (!needsScrollbar || !track || !thumb) {
            dimensionsRef.current = { maxContentScroll: 0, maxThumbScroll: 0 }
            return
        }

        // B. 内容的滚动范围
        const maxContentScroll = contentScrollWidth - contentClientWidth

        // C. 轨道的可用高度
        const trackHeight = track.clientHeight

        // D. 计算滑块的高度 (与内容比例一致)
        const visibleRatio = contentClientWidth / contentScrollWidth
        let thumbHeight = trackHeight * visibleRatio
        thumbHeight = Math.max(thumbHeight, 20) // 最小高度 20px
        thumb.style.height = `${thumbHeight}px`

        // E. 滑块可以滚动的最大 Y 距离
        const maxThumbScroll = trackHeight - thumbHeight

        // F. 存储尺寸以供其他函数使用
        dimensionsRef.current = { maxContentScroll, maxThumbScroll }

        // G. 确保滑块位置在调整尺寸后仍然正确
        syncThumbFromContent()
    }, [syncThumbFromContent]) // 依赖 syncThumbFromContent

    // --- 3. 事件处理 Effect ---
    // 效果：处理滚轮滚动 (在视口上)
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const handleWheel = (e: WheelEvent) => {
            if (!isScrollbarVisible) return

            // 我们只关心垂直滚动 (deltaY)
            if (e.deltaY !== 0) {
                e.preventDefault() // 阻止页面默认的上下滚动
                wrapper.scrollTo({
                    left: wrapper.scrollLeft + e.deltaY,
                })
                syncThumbFromContent() // 滚动内容后，同步滑块
            }
        }

        wrapper.addEventListener('wheel', handleWheel, { passive: false })
        return () => wrapper.removeEventListener('wheel', handleWheel)
    }, [isScrollbarVisible, syncThumbFromContent])

    // 效果：处理滑块拖动 (在 document 上)
    useEffect(() => {
        const thumb = thumbRef.current
        // 仅当滚动条可见时才添加拖动事件
        if (!isScrollbarVisible || !thumb) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return
            e.preventDefault()

            const { startY, startThumbTop } = startDragDataRef.current
            const { maxThumbScroll } = dimensionsRef.current

            const deltaY = e.clientY - startY
            let newThumbTop = startThumbTop + deltaY

            newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbScroll)) // 限制在轨道内

            thumb.style.top = `${newThumbTop}px`
            syncContentFromThumb() // 拖动滑块时，同步内容
        }

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDraggingRef.current) return
            e.preventDefault()
            isDraggingRef.current = false
            setIsDragging(false) // 更新 React 状态以改变样式
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation() // 阻止轨道的点击事件

            isDraggingRef.current = true
            setIsDragging(true) // 更新 React 状态

            startDragDataRef.current = {
                startY: e.clientY,
                startThumbTop: thumb.offsetTop,
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        thumb.addEventListener('mousedown', handleMouseDown)
        return () => {
            // 清理 document 上的事件
            thumb.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isScrollbarVisible, syncContentFromThumb])

    // 效果：处理轨道点击
    useEffect(() => {
        const track = trackRef.current
        const thumb = thumbRef.current
        if (!isScrollbarVisible || !track || !thumb) return

        const handleTrackClick = (e: MouseEvent) => {
            // 如果点的是滑块本身，则不处理
            if (e.target === thumb) return

            const { maxThumbScroll } = dimensionsRef.current
            const trackRect = track.getBoundingClientRect()
            const clickY = e.clientY - trackRect.top // 点击位置相对于轨道的 Y 坐标
            const thumbHeight = thumb.offsetHeight

            let newThumbTop = clickY - thumbHeight / 2 // 移动到点击中心
            newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbScroll)) // 限制范围

            thumb.style.top = `${newThumbTop}px`
            syncContentFromThumb() // 同步内容
        }

        track.addEventListener('click', handleTrackClick)
        return () => track.removeEventListener('click', handleTrackClick)
    }, [isScrollbarVisible, syncContentFromThumb])

    // --- 4. 关键效果：尺寸监听 (ResizeObserver) ---
    useEffect(() => {
        const wrapper = wrapperRef.current
        const content = contentRef.current
        if (!wrapper || !content) return

        // 创建一个 ResizeObserver 来监听尺寸变化
        const observer = new ResizeObserver(() => {
            // 当 wrapper (视口) 或 content (内容) 尺寸变化时，
            // 自动重新计算所有维度。
            updateDimensions()
        })

        // 监听视口和内容
        observer.observe(wrapper)
        observer.observe(content)

        // 同时也监听窗口大小变化
        window.addEventListener('resize', updateDimensions)

        // 立即执行一次以进行初始计算
        updateDimensions()

        return () => {
            // 清理
            observer.disconnect()
            window.removeEventListener('resize', updateDimensions)
        }
    }, [children, updateDimensions]) // 当 children 变化时也重新设置

    // --- 5. Tailwind 动态类 ---
    const thumbClasses = `
    w-full rounded-full bg-zinc-400 absolute top-0 
    transition-colors duration-200
    ${
        isDragging
            ? 'cursor-grabbing opacity-100 bg-gray-600' // 拖动时
            : 'cursor-grab opacity-70 hover:bg-gray-600 hover:opacity-100' // 正常
    }
  `

    // --- 6. 渲染 JSX ---
    return (
        <div className={cn('flex h-full w-full overflow-hidden', className)}>
            {/* 内容视口 */}
            <div
                ref={wrapperRef}
                className='h-full grow overflow-hidden' // 关键：overflow-hidden 隐藏原生滚动条
            >
                <div ref={contentRef} className='flex h-full w-min'>
                    {children}
                </div>
            </div>

            {/* 自定义滚动条 (条件渲染) */}
            {isScrollbarVisible && (
                <div ref={trackRef} className='relative h-full w-2 shrink-0 cursor-pointer bg-zinc-50'>
                    {/* 滑块 */}
                    <div ref={thumbRef} className={thumbClasses}></div>
                </div>
            )}
        </div>
    )
}
