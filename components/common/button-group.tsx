'use client'

import { cn } from '@/lib/utils'

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode
}
export function ButtonGroup({ className, children, ...props }: Props) {
    return (
        <div
            className={cn(
                'shadow-button flex rounded-full *:shadow-none [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}
