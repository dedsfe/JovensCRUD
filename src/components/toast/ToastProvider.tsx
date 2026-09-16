import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { PropsWithChildren } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  motionTransition,
  reducedMotionTransition,
} from '../../lib/motion'
import { ToastContext } from './toastContext'
import type { ToastInput } from './toastContext'
import styles from './ToastProvider.module.css'

interface ToastMessage extends Required<Pick<ToastInput, 'message' | 'tone'>> {
  id: string
  duration: number | null
}

const makeToast = (
  input: ToastInput,
  id: string = crypto.randomUUID(),
): ToastMessage => {
  const tone = input.tone ?? 'info'

  return {
    id,
    message: input.message,
    tone,
    duration: input.duration === undefined ? (tone === 'loading' ? null : 4500) : input.duration,
  }
}

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const reduceMotion = useReducedMotion()

  const showToast = useCallback((input: ToastInput): string => {
    const nextToast = makeToast(input)
    setToast(nextToast)
    return nextToast.id
  }, [])

  const updateToast = useCallback((id: string, input: ToastInput): void => {
    setToast((current) => (current?.id === id ? makeToast(input, id) : current))
  }, [])

  const dismissToast = useCallback((id?: string): void => {
    setToast((current) => (!id || current?.id === id ? null : current))
  }, [])

  useEffect(() => {
    if (!toast || toast.duration === null) return

    const timeout = window.setTimeout(() => dismissToast(toast.id), toast.duration)
    return () => window.clearTimeout(timeout)
  }, [dismissToast, toast])

  const value = useMemo(
    () => ({ showToast, updateToast, dismissToast }),
    [dismissToast, showToast, updateToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false} mode="wait">
          {toast && (
            <motion.div
              key={toast.id}
              className={styles.toast}
              data-tone={toast.tone}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              initial={reduceMotion ? false : { y: 12 }}
              animate={{ y: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: 6,
                      transition: motionTransition.exit,
                    }
              }
              transition={
                reduceMotion ? reducedMotionTransition : motionTransition.enter
              }
            >
              <span className={styles.statusMark} aria-hidden="true" />
              <span className={styles.message}>{toast.message}</span>
              {toast.tone !== 'loading' && (
                <button
                  className={styles.closeButton}
                  type="button"
                  aria-label="Fechar aviso"
                  onClick={() => dismissToast(toast.id)}
                >
                  ×
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
