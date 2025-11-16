import { DialogContext } from '@/components/common/confirm-dialog'
import { useContext } from 'react'

export function useDialog() {
    const context = useContext(DialogContext)
    if (!context) {
        throw new Error('useDialog must be used within a ConfirmDialogProvider')
    }
    return context.showDialog
}
