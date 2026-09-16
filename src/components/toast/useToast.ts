import { useContext } from 'react'
import { ToastContext } from './toastContext'
import type { ToastContextValue } from './toastContext'

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider.')
  }

  return context
}
