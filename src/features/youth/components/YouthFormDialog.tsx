import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useToast } from '../../../components/toast/useToast'
import { motionTransition, reducedMotionTransition } from '../../../lib/motion'
import {
  findDuplicateYouths,
  formatBrazilianDateInput,
  formatBrazilianPhone,
  isoDateToBrazilian,
  validateYouthForm,
  validateYouthField,
  validateYouthPhoto,
} from '../helpers/youthHelpers'
import { useYouths } from '../context/useYouths'
import type { Youth, YouthFormValues } from '../types/youth'
import type {
  YouthDuplicateMatch,
  YouthFormErrors,
  YouthFormField,
} from '../helpers/youthHelpers'
import styles from './YouthFormDialog.module.css'

interface YouthFormDialogProps {
  isOpen: boolean
  youth: Youth | null
  onClose: () => void
}

const emptyValues: YouthFormValues = {
  fullName: '',
  preferredName: '',
  birthDate: '',
  phone: '',
  status: 'active',
}

const valuesFromYouth = (youth: Youth | null): YouthFormValues =>
  youth
    ? {
        fullName: youth.fullName,
        preferredName: youth.preferredName === youth.fullName.split(/\s+/)[0]
          ? ''
          : youth.preferredName,
        birthDate: isoDateToBrazilian(youth.birthDate),
        phone: formatBrazilianPhone(youth.phone),
        status: youth.status === 'active' ? 'active' : 'inactive',
      }
    : emptyValues

const YouthFormDialog: React.FC<YouthFormDialogProps> = ({
  isOpen,
  youth,
  onClose,
}) => {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const { youths, createYouth, updateYouth } = useYouths()
  const { showToast, updateToast } = useToast()
  const [values, setValues] = useState<YouthFormValues>(emptyValues)
  const [photo, setPhoto] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<YouthFormErrors>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [shakingField, setShakingField] = useState<YouthFormField | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<YouthDuplicateMatch[]>(
    [],
  )
  const [deactivatePending, setDeactivatePending] = useState(false)
  const warningsAcknowledgedRef = useRef(false)

  const photoPreview = useMemo(() => {
    if (photo) return URL.createObjectURL(photo)
    if (!removePhoto) return youth?.photoUrl ?? null
    return null
  }, [photo, removePhoto, youth?.photoUrl])

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  useEffect(() => {
    if (!isOpen) return

    let isCurrent = true
    previousFocusRef.current = document.activeElement as HTMLElement | null
    queueMicrotask(() => {
      if (!isCurrent) return
      setValues(valuesFromYouth(youth))
      setPhoto(null)
      setRemovePhoto(false)
      setFieldErrors({})
      setPhotoError(null)
      setFormError(null)
      setShakingField(null)
      setIsSaving(false)
      setDuplicateMatches([])
      setDeactivatePending(false)
      warningsAcknowledgedRef.current = false
    })

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    return () => {
      isCurrent = false
      window.cancelAnimationFrame(focusFrame)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, youth])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSaving) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [isOpen, isSaving, onClose])

  const updateField = <Key extends keyof YouthFormValues>(
    field: Key,
    value: YouthFormValues[Key],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }))
    setDuplicateMatches([])
    setDeactivatePending(false)
    warningsAcknowledgedRef.current = false
    setFieldErrors((current) => {
      if (!current[field]) return current
      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
    setFormError(null)
  }

  const validateFieldOnBlur = (field: YouthFormField): void => {
    const message = validateYouthField(field, values)
    setFieldErrors((current) => {
      const nextErrors = { ...current }
      if (message) nextErrors[field] = message
      else delete nextErrors[field]
      return nextErrors
    })
  }

  const fieldControlClass = (field: YouthFormField): string =>
    [
      styles.control,
      't-input',
      fieldErrors[field] ? 'is-error' : '',
      shakingField === field ? 'is-shaking' : '',
    ]
      .filter(Boolean)
      .join(' ')

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextPhoto = event.target.files?.[0] ?? null
    const photoError = validateYouthPhoto(nextPhoto)

    if (photoError) {
      setPhoto(null)
      setPhotoError(photoError)
      showToast({ message: photoError, tone: 'error' })
      event.target.value = ''
      return
    }

    setPhoto(nextPhoto)
    setRemovePhoto(false)
    setPhotoError(null)
    setFormError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const validationErrors = validateYouthForm(values)
    const nextPhotoError = validateYouthPhoto(photo)
    const invalidFields = Object.keys(validationErrors) as YouthFormField[]

    if (invalidFields.length > 0 || nextPhotoError) {
      setFieldErrors(validationErrors)
      setPhotoError(nextPhotoError)
      const issueCount = invalidFields.length + (nextPhotoError ? 1 : 0)
      const message = issueCount === 1
        ? 'Revise o campo destacado antes de continuar.'
        : `Revise os ${issueCount} campos destacados antes de continuar.`
      setFormError(message)
      showToast({ message, tone: 'error' })

      const firstInvalidField = invalidFields[0]
      if (firstInvalidField) {
        setShakingField(null)
        window.requestAnimationFrame(() => {
          setShakingField(firstInvalidField)
          panelRef.current
            ?.querySelector<HTMLElement>(`[data-field="${firstInvalidField}"]`)
            ?.focus()
        })
        window.setTimeout(() => setShakingField(null), 320)
      }
      return
    }

    const matches = findDuplicateYouths(youths, values, youth?.id)
    const isDeactivating = youth?.status === 'active' && values.status === 'inactive'

    if (!warningsAcknowledgedRef.current && (matches.length > 0 || isDeactivating)) {
      warningsAcknowledgedRef.current = true
      setDuplicateMatches(matches)
      setDeactivatePending(isDeactivating)
      showToast({
        message:
          matches.length > 0
            ? 'Possível cadastro duplicado. Confirme para continuar.'
            : 'Confirme a desativação para continuar.',
        tone: 'warning',
      })
      return
    }

    setIsSaving(true)
    const toastId = showToast({
      message: youth ? 'Salvando alterações...' : 'Adicionando jovem...',
      tone: 'loading',
    })

    try {
      const input = { values, photo, removePhoto }
      if (youth) await updateYouth(youth, input)
      else await createYouth(input)

      updateToast(toastId, {
        message: youth ? 'Alterações salvas.' : 'Jovem adicionado ao diretório.',
        tone: 'success',
      })
      onClose()
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o cadastro.'
      setFormError(message)
      updateToast(toastId, { message, tone: 'error' })
      setIsSaving(false)
    }
  }

  const dialog = (
    <AnimatePresence>
      {isOpen && (
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
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) onClose()
            }}
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
                <h2 id={titleId}>{youth ? 'Editar jovem' : 'Adicionar jovem'}</h2>
                <p id={descriptionId}>
                  {youth
                    ? 'Atualize somente o que mudou.'
                    : 'Comece com as informações essenciais.'}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                className={styles.closeButton}
                type="button"
                aria-label="Fechar formulário"
                disabled={isSaving}
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.formBody}>
              <section className={styles.photoSection} aria-label="Foto do jovem">
                <span className={styles.photoPreview}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Prévia da foto selecionada" />
                  ) : (
                    <span aria-hidden="true">Foto</span>
                  )}
                </span>
                <div className={styles.photoActions}>
                  <div className={styles.photoHeading}>
                    <strong>Foto de perfil</strong>
                    <span>Opcional</span>
                  </div>
                  <small>JPG, PNG ou WebP. Tamanho máximo de 5 MB.</small>
                  <div>
                    <label className={styles.photoPicker}>
                      {photoPreview ? 'Trocar foto' : 'Escolher foto'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isSaving}
                        onChange={handlePhotoChange}
                      />
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setPhoto(null)
                          setRemovePhoto(true)
                          setPhotoError(null)
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {photoError && (
                    <span className={styles.photoError} role="alert">
                      {photoError}
                    </span>
                  )}
                </div>
              </section>

              <section className={styles.detailsSection}>
                <div className={styles.sectionHeading}>
                  <h3>Informações pessoais</h3>
                  <p><span aria-hidden="true">*</span> Campos obrigatórios</p>
                </div>

                <div className={styles.fields}>
                <label className={`${styles.field} ${styles.fullWidth} t-input-wrap ${fieldErrors.fullName ? 'is-error' : ''}`}>
                  <span>
                    Nome completo <b aria-hidden="true">*</b>
                  </span>
                  <input
                    className={fieldControlClass('fullName')}
                    data-field="fullName"
                    type="text"
                    value={values.fullName}
                    maxLength={120}
                    autoComplete="name"
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? `${titleId}-fullName-error` : undefined}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    onBlur={() => validateFieldOnBlur('fullName')}
                    required
                  />
                  {fieldErrors.fullName && (
                    <small id={`${titleId}-fullName-error`} className={`${styles.fieldError} t-error-msg`} role="alert">
                      {fieldErrors.fullName}
                    </small>
                  )}
                </label>

                <label className={`${styles.field} t-input-wrap ${fieldErrors.preferredName ? 'is-error' : ''}`}>
                  <span>
                    Como prefere ser chamado <b aria-hidden="true">*</b>
                  </span>
                  <input
                    className={fieldControlClass('preferredName')}
                    data-field="preferredName"
                    type="text"
                    value={values.preferredName}
                    maxLength={80}
                    autoComplete="nickname"
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.preferredName)}
                    aria-describedby={fieldErrors.preferredName ? `${titleId}-preferredName-error` : undefined}
                    onChange={(event) =>
                      updateField('preferredName', event.target.value)
                    }
                    onBlur={() => validateFieldOnBlur('preferredName')}
                    required
                  />
                  {fieldErrors.preferredName && (
                    <small id={`${titleId}-preferredName-error`} className={`${styles.fieldError} t-error-msg`} role="alert">
                      {fieldErrors.preferredName}
                    </small>
                  )}
                </label>

                <label className={`${styles.field} t-input-wrap ${fieldErrors.birthDate ? 'is-error' : ''}`}>
                  <span>
                    Data de nascimento <b aria-hidden="true">*</b>
                  </span>
                  <input
                    className={fieldControlClass('birthDate')}
                    data-field="birthDate"
                    type="text"
                    value={values.birthDate}
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="bday"
                    placeholder="DD/MM/AAAA"
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.birthDate)}
                    aria-describedby={fieldErrors.birthDate ? `${titleId}-birthDate-error` : undefined}
                    onChange={(event) =>
                      updateField('birthDate', formatBrazilianDateInput(event.target.value))
                    }
                    onBlur={() => validateFieldOnBlur('birthDate')}
                    required
                  />
                  {fieldErrors.birthDate && (
                    <small id={`${titleId}-birthDate-error`} className={`${styles.fieldError} t-error-msg`} role="alert">
                      {fieldErrors.birthDate}
                    </small>
                  )}
                </label>

                <label className={`${styles.field} t-input-wrap ${fieldErrors.phone ? 'is-error' : ''}`}>
                  <span>
                    Telefone <b aria-hidden="true">*</b>
                  </span>
                  <input
                    className={fieldControlClass('phone')}
                    data-field="phone"
                    type="tel"
                    value={values.phone}
                    maxLength={15}
                    inputMode="numeric"
                    autoComplete="tel"
                    disabled={isSaving}
                    placeholder="(11) 99999-9999"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? `${titleId}-phone-error` : undefined}
                    onChange={(event) =>
                      updateField('phone', formatBrazilianPhone(event.target.value))
                    }
                    onBlur={() => validateFieldOnBlur('phone')}
                    required
                  />
                  {fieldErrors.phone && (
                    <small id={`${titleId}-phone-error`} className={`${styles.fieldError} t-error-msg`} role="alert">
                      {fieldErrors.phone}
                    </small>
                  )}
                </label>

                <label className={`${styles.field} t-input-wrap ${fieldErrors.status ? 'is-error' : ''}`}>
                  <span>
                    Situação <b aria-hidden="true">*</b>
                  </span>
                  <span className={styles.selectControl}>
                    <select
                      className={fieldControlClass('status')}
                      data-field="status"
                      value={values.status}
                      disabled={isSaving}
                      aria-invalid={Boolean(fieldErrors.status)}
                      aria-describedby={fieldErrors.status ? `${titleId}-status-error` : undefined}
                      onChange={(event) =>
                        updateField('status', event.target.value as YouthFormValues['status'])
                      }
                      onBlur={() => validateFieldOnBlur('status')}
                      required
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m6 8 4 4 4-4" />
                    </svg>
                  </span>
                  {fieldErrors.status && (
                    <small id={`${titleId}-status-error`} className={`${styles.fieldError} t-error-msg`} role="alert">
                      {fieldErrors.status}
                    </small>
                  )}
                </label>
                </div>
              </section>

              {duplicateMatches.length > 0 && (
                <div
                  className={`${styles.feedback} ${styles.feedbackWarning}`}
                  role="alert"
                  aria-live="polite"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 3.5 18 17H2L10 3.5Z" />
                    <path d="M10 8.6v3.2M10 14.4v.1" />
                  </svg>
                  <span>
                    Possível cadastro duplicado. Confira antes de continuar:
                    <ul>
                      {duplicateMatches.map((match) => (
                        <li key={match.youth.id}>
                          {match.youth.fullName} ({match.reasons.join(', ')})
                        </li>
                      ))}
                    </ul>
                  </span>
                </div>
              )}

              {deactivatePending && (
                <div
                  className={`${styles.feedback} ${styles.feedbackWarning}`}
                  role="alert"
                  aria-live="polite"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 3.5 18 17H2L10 3.5Z" />
                    <path d="M10 8.6v3.2M10 14.4v.1" />
                  </svg>
                  <span>
                    Você está deixando {youth?.preferredName || 'este jovem'} como
                    inativo. Ele some da lista de ativos, mas o cadastro é mantido.
                  </span>
                </div>
              )}

              {formError && (
                <div className={styles.feedback} role="alert" aria-live="polite">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="7.25" />
                    <path d="M10 6.7v4.1M10 13.8v.1" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}
              </div>

              <footer className={styles.footer}>
                <button
                  className={styles.cancelButton}
                  type="button"
                  disabled={isSaving}
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button className={styles.submitButton} type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Salvando...'
                    : duplicateMatches.length > 0 || deactivatePending
                      ? youth
                        ? 'Salvar mesmo assim'
                        : 'Adicionar mesmo assim'
                      : youth
                        ? 'Salvar alterações'
                        : 'Adicionar jovem'}
                </button>
              </footer>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(dialog, document.body)
}

export default YouthFormDialog
