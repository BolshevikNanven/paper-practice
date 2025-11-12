'use client'

import { cn } from '@/lib/utils'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    variant?: 'icon' | 'ghost' | 'primary' | 'default'
    size?: 'md' | 'sm'
    disabled?: boolean
}
export function Button({ variant, size, disabled, className, children, ...props }: Props) {
    return (
        <button
            className={cn(
                'shadow-button flex h-10 cursor-pointer items-center gap-2 rounded-full bg-card px-3 text-sm text-foreground transition-all hover:bg-accent active:scale-90',
                {
                    'h-10 w-10 justify-center p-0': variant === 'icon',
                    'bg-transparent shadow-none hover:bg-accent': variant === 'ghost',
                    'bg-main text-background hover:bg-main/90': variant === 'primary',
                },
                {
                    'cursor-not-allowed bg-accent text-accent-foreground/40 hover:bg-accent active:scale-100': disabled,
                },
                {
                    'h-8': size === 'sm',
                    'w-8': size === 'sm' && variant === 'icon',
                },
                className,
            )}
            {...props}
        >
            {children}
        </button>
    )
}
