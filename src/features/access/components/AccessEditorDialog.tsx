import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { motionTransition, reducedMotionTransition } from '../../../lib/motion'
import { accessRoleLabels } from '../helpers/accessHelpers'
import type { AccessProfile, AccessRole, AccessUpdate } from '../types/access'
import styles from './AccessEditorDialog.module.css'

interface AccessEditorDialogProps {
  profile: AccessProfile | null
  isSaving: boolean
  onClose: () => void
  onSave: (update: AccessUpdate) => Promise<void>
}

const roleDescriptions: Record<AccessRole, string> = {
  member: 'A conta entra no sistema, mas não gerencia o diretório.',
  leader: 'Pode cadastrar e atualizar os jovens da comunidade.',
  admin: 'Controla jovens, contas, funções e permissões.',
}

const AccessEditorDialog: React.FC<AccessEditorDialogProps> = ({
  profile,
  isSaving,
  onClose,
  onSave,
}) => {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const [selectedRole, setSelectedRole] = useState<AccessRole>('member')

  useEffect(() => {
    if (!profile) return
    let isCurrent = true
    previousFocusRef.current = document.activeElement as HTMLElement | null
    queueMicrotask(() => {
      if (isCurrent) setSelectedRole(profile.role)
    })
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      isCurrent = false
      window.cancelAnimationFrame(focusFrame)
      previousFocusRef.current?.focus()
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSaving) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose, profile])

  const dialog = (
    <AnimatePresence>
      {profile && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) onClose()
          }}
        >
          <motion.span
            className={styles.scrim}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? reducedMotionTransition : motionTransition.enter}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={reduceMotion ? false : { y: 8, scale: 0.99 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { y: 4, scale: 0.99 }}
            transition={reduceMotion ? reducedMotionTransition : motionTransition.enter}
          >
            <header className={styles.header}>
              <div>
                <h2 id={titleId}>Gerenciar acesso</h2>
                <p id={descriptionId}>Defina exatamente o que esta conta pode fazer.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar gerenciamento de acesso"
                disabled={isSaving}
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className={styles.body}>
              <section className={styles.identity} aria-label="Conta selecionada">
                <span aria-hidden="true">
                  {profile.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('')}
                </span>
                <div>
                  <strong>{profile.fullName}</strong>
                  <small>{profile.email || 'E-mail não disponível'}</small>
                </div>
              </section>

              <fieldset className={styles.roles}>
                <legend>Função no sistema</legend>
                <div className={styles.roleOptions}>
                  {(Object.keys(accessRoleLabels) as AccessRole[]).map((role) => (
                    <label key={role} data-selected={selectedRole === role}>
                      <input
                        type="radio"
                        name="access-role"
                        value={role}
                        checked={selectedRole === role}
                        disabled={isSaving}
                        onChange={() => setSelectedRole(role)}
                      />
                      <span>
                        <strong>{accessRoleLabels[role]}</strong>
                        <small>{roleDescriptions[role]}</small>
                      </span>
                      <i aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>

              {selectedRole === 'admin' && profile.role !== 'admin' && (
                <p className={styles.adminNotice} role="status">
                  Administradores podem alterar o acesso de outras contas.
                </p>
              )}
            </div>

            <footer className={styles.footer}>
              {profile.status !== 'blocked' && (
                <button
                  className={styles.blockButton}
                  type="button"
                  disabled={isSaving}
                  onClick={() => onSave({ role: selectedRole, status: 'blocked' })}
                >
                  Bloquear acesso
                </button>
              )}
              <button
                className={styles.cancelButton}
                type="button"
                disabled={isSaving}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                type="button"
                disabled={isSaving || (profile.status === 'active' && selectedRole === profile.role)}
                onClick={() =>
                  onSave({
                    role: selectedRole,
                    status: 'active',
                  })
                }
              >
                {isSaving
                  ? 'Salvando...'
                  : profile.status === 'pending'
                    ? 'Aprovar acesso'
                    : profile.status === 'blocked'
                      ? 'Reativar acesso'
                      : 'Salvar alterações'}
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(dialog, document.body)
}

export default AccessEditorDialog
