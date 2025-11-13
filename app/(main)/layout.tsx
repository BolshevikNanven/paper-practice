import { ConfirmDialogProvider } from '@/components/common/confirm-dialog'

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className='h-screen w-screen overflow-hidden bg-zinc-50'>
            <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </div>
    )
}
