'use client'

import {
    ArticleMediumIcon,
    FilePdfIcon,
    ImageIcon,
    PlusCircleIcon,
    SpinnerIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react'
import { Button } from '../common/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useRef, useState } from 'react'
import { convertDomToImage, convertPdfToImages } from '@/lib/image'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Textarea } from '../ui/textarea'

interface Props {
    onCreate?: (imgs: Blob[]) => void
}
export function PaperCreator({ onCreate }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const printRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(false)
    const [text, setText] = useState('')

    const handleFileTrigger = (acceptType: 'image/*' | 'application/pdf') => {
        if (inputRef.current) {
            inputRef.current.accept = acceptType
            inputRef.current.click()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!inputRef.current || !files || files.length === 0) {
            return
        }

        const currentAccept = inputRef.current?.accept

        if (currentAccept === 'image/*') {
            onCreate?.(Array.from(files))
        } else if (currentAccept === 'application/pdf') {
            handlePdf(files)
        } else {
            console.error('Unknown accept type')
            return
        }

        inputRef.current.value = ''
    }

    const handlePdf = async (files: FileList) => {
        const canvasEl = document.createElement('canvas')

        const allFilesPromises = Array.from(files).map(file => convertPdfToImages(file, canvasEl))

        setLoading(true)
        try {
            const allFilesImages = await Promise.all(allFilesPromises)

            onCreate?.(allFilesImages.flat())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }

        canvasEl.remove()
    }

    const handleText = async () => {
        setLoading(true)

        try {
            const image = await convertDomToImage(printRef.current!)
            onCreate?.([image])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild disabled={loading}>
                    <Button className='active:scale-100'>
                        {loading ? <SpinnerIcon size={18} className='animate-spin' /> : <PlusCircleIcon size={18} />}
                        添加资料
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='use-dropdown-menu-fit-w'>
                    <DropdownMenuItem onSelect={() => handleFileTrigger('image/*')}>
                        <ImageIcon />
                        图片
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleFileTrigger('application/pdf')}>
                        <FilePdfIcon />
                        文件
                    </DropdownMenuItem>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={() => setText('')}>
                            <ArticleMediumIcon />
                            文本
                        </DropdownMenuItem>
                    </DialogTrigger>
                </DropdownMenuContent>
                <input ref={inputRef} type='file' className='hidden' multiple onChange={handleChange} />
            </DropdownMenu>
            <DialogContent className='max-h-full overflow-hidden'>
                <DialogHeader>
                    <DialogTitle>添加文本资料</DialogTitle>
                    <VisuallyHidden>
                        <DialogDescription>添加文本型资料</DialogDescription>
                    </VisuallyHidden>
                </DialogHeader>
                <div className='grid w-full gap-2'>
                    <Textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder='在此输入文本资料'
                        className='max-h-[60vh] min-h-50'
                    />
                    <p className='flex items-center gap-1 text-sm text-muted-foreground'>
                        <WarningCircleIcon />
                        你的文本资料将会被转换为图片
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild onClick={handleText}>
                        <Button variant='primary' disabled={text === ''}>
                            立即添加
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
            <div className='fixed top-[-9999px] left-[-9999px]'>
                <div ref={printRef} className='w-[800px] bg-white p-6 text-black'>
                    <pre className='font-sans text-lg leading-relaxed wrap-break-word whitespace-pre-wrap'>{text}</pre>
                </div>
            </div>
        </Dialog>
    )
}
