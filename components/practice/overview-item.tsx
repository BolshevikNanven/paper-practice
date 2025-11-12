import { cn } from '@/lib/utils'
import { usePracticeStore } from '@/store/practice'

export interface PracticeNode {
    title: string
    children?: PracticeNode[]
    deep?: number
}

interface Props {
    node: PracticeNode
    active?: boolean
    deep?: number
}

export function PracticeOverviewItem({ node, deep = 0, active }: Props) {
    const { selectSubject } = usePracticeStore(s => s.actions)

    function handleSelect() {
        selectSubject(active ? undefined : node.title)
    }

    return (
        <div
            onClick={handleSelect}
            className={cn(
                'flex h-9 shrink-0 cursor-pointer items-center rounded-md px-2 text-sm text-accent-foreground transition-all hover:bg-accent',
                {
                    'bg-main font-bold text-background hover:bg-main': active,
                },
            )}
            style={{ paddingLeft: deep * 16 + 8 + 'px' }}
        >
            {node.title}
        </div>
    )
}
