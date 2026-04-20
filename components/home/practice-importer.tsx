'use client'

import { Persist } from '@/lib/persist'
import { Repository } from '@/db/repository'
import { usePracticeSetStore } from '@/store/practice-set'
import { DownloadSimpleIcon, SpinnerIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { UploadWrapper } from '../common/upload-wrapper'

export function PracticeImporter() {
    const { loadPrivateData } = usePracticeSetStore(s => s.actions)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function handleImport(files: FileList) {
        const file = files[0]
        if (!file) {
            return
        }

        setLoading(true)
        setMessage('')
        setError('')

        try {
            const data = await Persist.importPracticeSetFromZip(file)
            await Repository.importPracticeSet(data)
            await loadPrivateData()
            setMessage(`已导入 ${data.title}`)
        } catch (err) {
            const nextError = err instanceof Error ? err.message : '导入失败，请确认 ZIP 文件格式正确。'
            setError(nextError)
        } finally {
            setLoading(false)
        }
    }

    return (
        <UploadWrapper onFileSelect={handleImport} accept='.zip,application/zip' disabled={loading}>
            <div className='flex aspect-3/4 w-60 flex-col border-2 p-4 transition-all hover:scale-105 active:scale-95'>
                {loading ? (
                    <SpinnerIcon size={32} className='m-auto animate-spin text-muted-foreground' />
                ) : (
                    <DownloadSimpleIcon size={32} className='m-auto text-muted-foreground' />
                )}
                <p className='text-sm'>{loading ? '正在导入...' : '导入题库'}</p>
                {message && <p className='mt-1 text-xs text-muted-foreground'>{message}</p>}
                {error && <p className='mt-1 text-xs text-destructive'>{error}</p>}
            </div>
        </UploadWrapper>
    )
}
