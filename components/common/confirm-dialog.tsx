'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createContext, useContext, useState, useCallback } from 'react'
import { Button } from './button'
import { SpinnerIcon } from '@phosphor-icons/react'

interface DialogOptions {
    title: string
    description?: string
    onConfirm?: () => Promise<void> | void
    onCancel?: () => void
}

interface DialogContextType {
    showDialog: (options: DialogOptions) => void
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState<string | undefined>()

    const [onConfirm, setOnConfirm] = useState<(() => Promise<void> | void) | undefined>()
    const [onCancel, setOnCancel] = useState<(() => void) | undefined>()

    const [loading, setLoading] = useState(false)

    const showDialog = useCallback((options: DialogOptions) => {
        setTitle(options.title)
        setDescription(options.description)
        setOnConfirm(() => options.onConfirm)
        setOnCancel(() => options.onCancel)
        setOpen(true)
    }, [])

    const handleCancel = () => {
        setOpen(false)
        if (onCancel) onCancel()
    }

    const handleConfirm = async () => {
        if (onConfirm) {
            setLoading(true)
            try {
                await onConfirm()
            } finally {
                setLoading(false)
                setOpen(false)
            }
        } else {
            setOpen(false)
        }
    }

    return (
        <DialogContext.Provider value={{ showDialog }}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='ghost' onClick={handleCancel} disabled={loading}>
                            取消
                        </Button>
                        <Button variant='primary' onClick={handleConfirm} disabled={loading}>
                            {loading && <SpinnerIcon className='animate-spin' />}
                            确认
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DialogContext.Provider>
    )
}
