import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { motionDuration, motionEase, reducedMotionTransition } from '../../../lib/motion'
import styles from './SignOutConfirmationDialog.module.css'

interface SignOutConfirmationDialogProps {
  isOpen: boolean
  isSigningOut: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

const SignOutConfirmationDialog: React.FC<SignOutConfirmationDialogProps> = ({
  isOpen,
  isSigningOut,
  onClose,
  onConfirm,
}) => {
  const titleId = useId()
  const descId = useId()
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const timer = window.requestAnimationFrame(() => {
      cancelBtnRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(timer)
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSigningOut) {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSigningOut, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={
            reduceMotion
              ? reducedMotionTransition
              : { duration: motionDuration.standard, ease: motionEase.out }
          }
          onClick={() => {
            if (!isSigningOut) onClose()
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className={styles.panel}
            initial={reduceMotion ? false : { opacity: 0.9, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            transition={
              reduceMotion
                ? reducedMotionTransition
                : { duration: motionDuration.deliberate, ease: motionEase.out }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.heading}>
              <h2 id={titleId}>Sair da sua conta?</h2>
              <p id={descId}>
                Você será desconectado deste dispositivo. Para voltar a usar o
                sistema, basta informar seu e-mail e senha.
              </p>
            </div>

            <div className={styles.actions}>
              <button
                ref={cancelBtnRef}
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isSigningOut}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={() => void onConfirm()}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Saindo...' : 'Sim, sair'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default SignOutConfirmationDialog
