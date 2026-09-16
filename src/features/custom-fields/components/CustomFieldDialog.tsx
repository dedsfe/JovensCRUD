import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { customFieldTypeLabels, emptyCustomFieldDraft, validateCustomFieldDraft } from '../helpers/customFieldHelpers'
import type { CustomField, CustomFieldDraft, CustomFieldType } from '../types/customField'
import styles from './CustomFieldDialog.module.css'

interface Props {
  field: CustomField | null
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSave: (draft: CustomFieldDraft) => Promise<void>
}

const CustomFieldDialog: React.FC<Props> = ({ field, isOpen, isSaving, onClose, onSave }) => {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState<CustomFieldDraft>(emptyCustomFieldDraft)
  const [optionRows, setOptionRows] = useState<string[]>(['', ''])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    const nextDraft: CustomFieldDraft = field
      ? { label: field.label, type: field.type, required: field.required, options: [...field.options] }
      : { ...emptyCustomFieldDraft, options: [] }
    queueMicrotask(() => {
      setDraft(nextDraft)
      setOptionRows(nextDraft.options.length >= 2 ? nextDraft.options : ['', ''])
      setErrors({})
    })
    const frame = requestAnimationFrame(() => closeRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [field, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSaving) onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ))
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const normalized: CustomFieldDraft = {
      ...draft,
      options: optionRows.map((item) => item.trim()).filter(Boolean),
    }
    const nextErrors = validateCustomFieldDraft(normalized)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const target = nextErrors.label ? 'label' : 'options'
      panelRef.current?.querySelector<HTMLElement>(`[data-field="${target}"]`)?.focus()
      return
    }
    await onSave(normalized)
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.header}>
          <div><h2 id={titleId}>{field ? 'Editar campo' : 'Novo campo'}</h2><p>O campo aparecerá nas informações adicionais do jovem.</p></div>
          <button ref={closeRef} type="button" aria-label="Fechar formulário" disabled={isSaving} onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <label className={styles.field}>
              <span>Nome do campo</span>
              <input data-field="label" type="text" value={draft.label} maxLength={80} disabled={isSaving}
                placeholder="Ex.: Ministério em que atua" aria-invalid={Boolean(errors.label)}
                onChange={(event) => { setDraft((current) => ({ ...current, label: event.target.value })); setErrors((current) => ({ ...current, label: '' })) }} />
              {errors.label && <small role="alert">{errors.label}</small>}
            </label>
            <label className={styles.field}>
              <span>Tipo de resposta</span>
              <span className={styles.selectControl}>
                <select value={draft.type} disabled={isSaving} onChange={(event) => {
                  setDraft((current) => ({ ...current, type: event.target.value as CustomFieldType }))
                  setErrors((current) => ({ ...current, options: '' }))
                }}>
                  {(Object.entries(customFieldTypeLabels) as Array<[CustomFieldType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
              </span>
            </label>
            {draft.type === 'select' && <fieldset className={styles.optionField}>
              <legend>Opções da lista</legend>
              <div className={styles.optionList}>
                {optionRows.map((option, index) => (
                  <div className={styles.optionRow} key={index}>
                    <label htmlFor={`${titleId}-option-${index}`}>Opção {index + 1}</label>
                    <input id={`${titleId}-option-${index}`} data-field={index === 0 ? 'options' : undefined}
                      type="text" value={option} maxLength={120}
                      disabled={isSaving} placeholder={index === 0 ? 'Ex.: Louvor' : 'Ex.: Mídia'}
                      aria-invalid={Boolean(errors.options)} onChange={(event) => {
                        const nextValue = event.target.value
                        setOptionRows((current) => current.map((item, itemIndex) => itemIndex === index ? nextValue : item))
                        setErrors((current) => ({ ...current, options: '' }))
                      }} />
                    <button type="button" disabled={isSaving || optionRows.length <= 2}
                      aria-label={`Remover opção ${index + 1}`} onClick={() => setOptionRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6M8.5 9v4M11.5 9v4" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button className={styles.addOptionButton} type="button" disabled={isSaving || optionRows.length >= 30}
                onClick={() => setOptionRows((current) => [...current, ''])}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
                Adicionar opção
              </button>
              {errors.options && <small role="alert">{errors.options}</small>}
            </fieldset>}
            <label className={styles.checkRow}>
              <input type="checkbox" checked={draft.required} disabled={isSaving}
                onChange={(event) => setDraft((current) => ({ ...current, required: event.target.checked }))} />
              <span><strong>Resposta obrigatória</strong><small>O cadastro só será salvo após o preenchimento.</small></span>
            </label>
          </div>
          <footer className={styles.footer}>
            <button type="button" disabled={isSaving} onClick={onClose}>Cancelar</button>
            <button className={styles.saveButton} type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : field ? 'Salvar campo' : 'Criar campo'}</button>
          </footer>
        </form>
      </div>
    </div>, document.body,
  )
}

export default CustomFieldDialog
