'use client'

import { Tab } from '@/app/(main)/page'
import { NavItem } from '@/components/home/navigation-item'
import { BookmarksIcon, BookOpenIcon, PackageIcon } from '@phosphor-icons/react'
import Image from 'next/image'

interface Props {
    navigation: keyof typeof Tab
    onNavigate?: (target: keyof typeof Tab) => void
}
export function Navigation({ navigation, onNavigate }: Props) {
    return (
        <nav className='flex w-[320px] flex-col px-4'>
            <header className='my-4 flex h-10 items-center gap-2'>
                <Image src={'/practice.png'} alt='logo' height={16} width={532 * (16 / 64)} />
            </header>
            <div className='mb-4 h-px bg-border'></div>
            <div className='flex flex-col gap-1'>
                <NavItem active={navigation === 'public'} onClick={() => onNavigate?.('public')}>
                    <BookOpenIcon size={18} />
                    公共题库
                </NavItem>
                <NavItem active={navigation === 'own'} onClick={() => onNavigate?.('own')}>
                    <PackageIcon size={18} />
                    我的题库
                </NavItem>
                <NavItem active={navigation === 'star'} onClick={() => onNavigate?.('star')}>
                    <BookmarksIcon size={18} />
                    收藏
                </NavItem>
            </div>
        </nav>
    )
}
