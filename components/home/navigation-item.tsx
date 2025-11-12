'use client'

import { cn } from '@/lib/utils'
import { HTMLProps } from 'react'

interface Props extends HTMLProps<HTMLDivElement> {
    active?: boolean
    children: React.ReactNode
}
export function NavItem({ active, children, ...props }: Props) {
    return (
        <div
            className={cn(
                'flex h-11 cursor-pointer items-center gap-2 px-4 text-sm transition-all select-none',
                active ? 'bg-main/20' : 'hover:bg-muted active:scale-95',
            )}
            {...props}
        >
            {children}
        </div>
    )
}
