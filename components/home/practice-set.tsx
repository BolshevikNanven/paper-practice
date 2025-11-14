import Link from 'next/link'

interface Props {
    route: string
    title: string
    updatedAt: string
}
export function PracticeSet({ route, title, updatedAt }: Props) {
    return (
        <Link
            href={route}
            className='flex aspect-3/4 w-60 flex-col border bg-card p-4 shadow-lg transition-all hover:scale-105 active:scale-95'
        >
            <p className='mt-auto text-wrap break-all whitespace-break-spaces leading-5'>{title}</p>
            <span className='text-xs text-muted-foreground mt-2'>{updatedAt}</span>
        </Link>
    )
}
