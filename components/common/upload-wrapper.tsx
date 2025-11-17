'use client'

import { cn } from '@/lib/utils'
import React, { ChangeEvent, useRef } from 'react'

interface Props {
    onFileSelect?: (file: FileList) => void
    accept?: string
    multiple?: boolean
    children?: React.ReactNode
    className?: string
}

export function UploadWrapper({ onFileSelect, accept = '', multiple = false, className, children }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)

    const triggerFile = () => {
        if (inputRef.current) {
            inputRef.current.value = ''
        }
        inputRef.current?.click()
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            onFileSelect?.(files)
        }
    }

    return (
        <div onClick={triggerFile} className={cn('cursor-pointer', className)}>
            {children || '点击上传文件'}
            <input
                ref={inputRef}
                type='file'
                style={{ display: 'none' }}
                accept={accept}
                multiple={multiple}
                onChange={handleChange}
            />
        </div>
    )
}
