import { create, } from 'zustand'
import { createPracticeSlice, PracticeSlice } from './practice'

export type Store = PracticeSlice

export const useStore = create<Store>()((...a) => ({
    ...createPracticeSlice(...a),
}))
