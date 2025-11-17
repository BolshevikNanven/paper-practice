'use client'

import { DownloadSimpleIcon } from "@phosphor-icons/react"

export function PracticeImporter() {
    return (
        <div className='flex aspect-3/4 w-60 cursor-pointer flex-col border-2 p-4 transition-all hover:scale-105 active:scale-95'>
            <DownloadSimpleIcon size={32} className='m-auto text-muted-foreground' />
            <p className='text-sm'>导入题库</p>
        </div>
    )
}
