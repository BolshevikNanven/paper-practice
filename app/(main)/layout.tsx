import { ConfirmDialogProvider } from '@/components/common/confirm-dialog'
import { PlaygroundProvider } from '@/components/common/playground'

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className='h-screen w-screen overflow-hidden bg-zinc-50'>
            <ConfirmDialogProvider>
                <PlaygroundProvider>{children}</PlaygroundProvider>
            </ConfirmDialogProvider>
        </div>
    )
}
