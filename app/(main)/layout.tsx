export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) { 
    return (
        <div className="bg-zinc-50 w-screen h-screen overflow-hidden">
            {children}
        </div>
    )
}