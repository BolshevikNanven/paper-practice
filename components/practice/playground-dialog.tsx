'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

import { cn } from '@/lib/utils'
import { Button } from '../common/button'
import { XIcon } from '@phosphor-icons/react'

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot='dialog' {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot='dialog-overlay'
            className={cn(
                'fixed inset-0 z-50 bg-black/20 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    )
}

function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
}) {
    return (
        <DialogPortal data-slot='dialog-portal'>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot='dialog-content'
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-full bg-transparent duration-200 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    className,
                )}
                {...props}
            >
                <VisuallyHidden.Root>
                    <DialogPrimitive.Title>playground</DialogPrimitive.Title>
                    <DialogPrimitive.Description>play practice</DialogPrimitive.Description>
                </VisuallyHidden.Root>
                {children}
                <DialogPrimitive.Close asChild data-slot='dialog-close'>
                    <Button variant='icon' className='fixed top-4 right-4'>
                        <XIcon size={18} />
                    </Button>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    )
}

export { Dialog, DialogOverlay, DialogPortal, DialogContent }
