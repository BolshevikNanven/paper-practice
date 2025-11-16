import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface Store {
    overviewWidth: number
    overviewShown: boolean
    constructionSidebarWidth: number
    playgroundSettings: {
        scale: number
        narrow: boolean
    }
    actions: {
        setOverviewWidth: (setter: (p: number) => number) => void
        switchOverviewShown: (s?: boolean) => void
        setConstructionSidebarWidth: (setter: (p: number) => number) => void
        setPlaygroundSettings: (s: Store['playgroundSettings']) => void
    }
}

const initial: Omit<Store, 'actions'> = {
    overviewWidth: 280,
    overviewShown: true,
    constructionSidebarWidth: 340,
    playgroundSettings: {
        scale: 60,
        narrow: false,
    },
}

export const useGeneralStore = create<Store>()(
    persist(
        (set, get) => ({
            ...initial,
            actions: {
                setConstructionSidebarWidth(setter) {
                    set(state => ({ constructionSidebarWidth: setter(state.constructionSidebarWidth) }))
                },
                setOverviewWidth(setter) {
                    set(state => ({ overviewWidth: setter(state.overviewWidth) }))
                },
                switchOverviewShown(s) {
                    set(state => ({ overviewShown: s === undefined ? !state.overviewShown : s }))
                },
                setPlaygroundSettings(s) {
                    set({ playgroundSettings: s })
                },
            },
        }),
        {
            name: 'general-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: state => Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'actions')),
        },
    ),
)
