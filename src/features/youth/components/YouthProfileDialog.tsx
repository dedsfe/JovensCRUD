import { useEffect, useId, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useToast } from '../../../components/toast/useToast'
import {
  motionDuration,
  motionEase,
  reducedMotionTransition,
} from '../../../lib/motion'
import {
  getBirthdayDetails,
  getWhatsAppUrl,
  isoDateToBrazilian,
} from '../helpers/youthHelpers'
import type { Youth } from '../types/youth'
import styles from './YouthProfileDialog.module.css'

interface YouthProfileDialogProps {
  youth: Youth | null
  isOpen: boolean
  canManage: boolean
  onClose: () => void
  onEdit: (youth: Youth) => void
}

const WhatsAppIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.9c0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.1.8.3 1.4.5 1.9.7.8.2 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.6-.5Z" />
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Z" />
  </svg>
)

const PhoneIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const CopyIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const EditIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 14.8.7-3.2L13 3.3a1.7 1.7 0 0 1 2.4 0l1.3 1.3a1.7 1.7 0 0 1 0 2.4l-8.3 8.3-3.2.7Z" />
    <path d="m11.8 4.5 3.7 3.7" />
  </svg>
)

const formatBirthDate = (birthDate: string | null | undefined): string => {
  if (!birthDate) return 'Não informada'
  try {
    const [year, month, day] = birthDate.split('-').map(Number)
    if (!year || !month || !day) return isoDateToBrazilian(birthDate)
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  } catch {
    return isoDateToBrazilian(birthDate)
  }
}

const formatJoinDate = (createdAt: string | null | undefined): string => {
  if (!createdAt) return ''
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
      new Date(createdAt),
    )
  } catch {
    return ''
  }
}

const YouthProfileDialog: React.FC<YouthProfileDialogProps> = ({
  youth,
  isOpen,
  canManage,
  onClose,
  onEdit,
}) => {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const { showToast } = useToast()

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const timer = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(timer)
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const birthday = useMemo(() => {
    return youth ? getBirthdayDetails(youth.birthDate) : null
  }, [youth])

  const formattedBirthDate = formatBirthDate(youth?.birthDate)
  const formattedJoinDate = formatJoinDate(youth?.createdAt)

  const handleCopyContact = async (): Promise<void> => {
    if (!youth) return
    const text = `${youth.fullName}\nTelefone: ${youth.phone || 'Não informado'}`
    try {
      await navigator.clipboard.writeText(text)
      showToast({
        message: `Contato de ${youth.preferredName} copiado!`,
        tone: 'success',
      })
    } catch {
      showToast({
        message: 'Não foi possível copiar o contato.',
        tone: 'error',
      })
    }
  }

  if (typeof document === 'undefined' || !youth) return null

  const whatsappUrl = getWhatsAppUrl(
    youth.phone,
    youth.preferredName,
    birthday?.isToday ? 'birthday' : 'general',
  )
  const phoneDigits = youth.phone.replace(/\D/g, '')

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
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={styles.panel}
            initial={reduceMotion ? false : { opacity: 0.95, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            transition={
              reduceMotion
                ? reducedMotionTransition
                : { duration: motionDuration.deliberate, ease: motionEase.out }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar ficha do jovem"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className={styles.scrollArea}>
              {/* Seção Hero */}
              <div className={styles.hero}>
                <div className={styles.avatarWrapper} aria-hidden="true">
                  {youth.photoUrl ? (
                    <img src={youth.photoUrl} alt="" />
                  ) : (
                    youth.initials
                  )}
                </div>

                <div className={styles.names}>
                  <h2 id={titleId}>{youth.preferredName}</h2>
                  <p>{youth.fullName}</p>
                </div>

                <div className={styles.badges}>
                  <span
                    className={styles.statusBadge}
                    data-active={youth.status === 'active'}
                  >
                    <span className={styles.statusDot} aria-hidden="true" />
                    {youth.status === 'active'
                      ? 'Ativo'
                      : youth.status === 'inactive'
                        ? 'Inativo'
                        : 'Arquivado'}
                  </span>

                  {birthday?.isCurrentMonth && (
                    <span
                      className={
                        birthday.isToday ? styles.todayTag : styles.birthdayTag
                      }
                    >
                      🎂 {birthday.isToday
                        ? 'Aniversário hoje! 🎉'
                        : `Aniversário dia ${birthday.day}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Ações Rápidas de Contato */}
              <div className={styles.actionsBar}>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionItem} ${styles.whatsappAction}`}
                    title={`Conversar com ${youth.preferredName} no WhatsApp`}
                  >
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                {phoneDigits ? (
                  <a
                    href={`tel:${phoneDigits}`}
                    className={`${styles.actionItem} ${styles.callAction}`}
                    title={`Ligar para ${youth.preferredName}`}
                  >
                    <PhoneIcon />
                    <span>Ligar</span>
                  </a>
                ) : null}

                <button
                  type="button"
                  className={styles.actionItem}
                  onClick={() => void handleCopyContact()}
                  title="Copiar dados de contato"
                >
                  <CopyIcon />
                  <span>Copiar</span>
                </button>

                {canManage && (
                  <button
                    type="button"
                    className={styles.actionItem}
                    onClick={() => {
                      onClose()
                      onEdit(youth)
                    }}
                    title="Editar informações do jovem"
                  >
                    <EditIcon />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {/* Card de Dados Pessoais */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                  </svg>
                  <span>Dados Pessoais</span>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoBlock}>
                    <span>Nascimento</span>
                    <strong>{formattedBirthDate}</strong>
                  </div>

                  <div className={styles.infoBlock}>
                    <span>Idade atual</span>
                    <strong>
                      {youth.age !== null ? `${youth.age} anos` : 'Não informada'}
                    </strong>
                  </div>

                  <div className={styles.infoBlock}>
                    <span>Telefone</span>
                    <strong>{youth.phone || 'Não informado'}</strong>
                  </div>

                  {formattedJoinDate && (
                    <div className={styles.infoBlock}>
                      <span>Membro desde</span>
                      <strong>{formattedJoinDate}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Observações Pastorais */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>Observações Pastorais e Ministérios</span>
                </div>

                {youth.notes ? (
                  <p className={styles.notesContent}>{youth.notes}</p>
                ) : (
                  <div className={styles.emptyNotes}>
                    <span>Nenhuma observação registrada ainda.</span>
                    {canManage && (
                      <button
                        type="button"
                        className={styles.addNotesButton}
                        onClick={() => {
                          onClose()
                          onEdit(youth)
                        }}
                      >
                        Adicionar anotação
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.footerSecondaryButton}
                onClick={onClose}
              >
                Fechar
              </button>
              {canManage && (
                <button
                  type="button"
                  className={styles.footerPrimaryButton}
                  onClick={() => {
                    onClose()
                    onEdit(youth)
                  }}
                >
                  <EditIcon />
                  Editar cadastro
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default YouthProfileDialog
