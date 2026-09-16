import { createContext } from 'react'

export type ToastTone = 'info' | 'success' | 'warning' | 'error' | 'loading'

export interface ToastInput {
  message: string
  tone?: ToastTone
  duration?: number | null
}

export interface ToastContextValue {
  showToast: (input: ToastInput) => string
  updateToast: (id: string, input: ToastInput) => void
  dismissToast: (id?: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
