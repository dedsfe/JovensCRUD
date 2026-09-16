import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../../../components/toast/useToast'
import { useYouths } from '../../youth/context/useYouths'
import { customFieldsApi } from '../api/customFieldsApi'
import CustomFieldDialog from '../components/CustomFieldDialog'
import { customFieldTypeLabels } from '../helpers/customFieldHelpers'
import type { CustomField, CustomFieldDraft } from '../types/customField'
import styles from './CustomFieldsPage.module.css'

interface DeleteFieldDialogProps {
  field: CustomField | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

const DeleteFieldDialog: React.FC<DeleteFieldDialogProps> = ({
  field,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!field) return
    const frame = requestAnimationFrame(() => cancelRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isDeleting) onCancel()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [field, isDeleting, onCancel])

  if (!field) return null

  return createPortal(
    <div className={styles.confirmBackdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isDeleting) onCancel()
    }}>
      <section ref={dialogRef} className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>Apagar “{field.label}”?</h2>
        <p>O campo e todas as respostas preenchidas nele serão apagados definitivamente. Essa ação não pode ser desfeita.</p>
        <div className={styles.confirmActions}>
          <button ref={cancelRef} type="button" disabled={isDeleting} onClick={onCancel}>Cancelar</button>
          <button className={styles.deleteButton} type="button" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? 'Apagando...' : 'Apagar definitivamente'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

const CustomFieldsPage: React.FC = () => {
  const { access, customFields, isLoading, error, refresh } = useYouths()
  const { showToast, updateToast } = useToast()
  const [selectedField, setSelectedField] = useState<CustomField | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busyFieldId, setBusyFieldId] = useState<string | null>(null)
  const [fieldPendingDelete, setFieldPendingDelete] = useState<CustomField | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isAdmin = access?.role === 'admin' && access.status === 'active'

  const openCreate = (): void => { setSelectedField(null); setIsDialogOpen(true) }
  const openEdit = (field: CustomField): void => { setSelectedField(field); setIsDialogOpen(true) }

  const handleSave = useCallback(async (draft: CustomFieldDraft): Promise<void> => {
    setIsSaving(true)
    const toastId = showToast({ message: selectedField ? 'Salvando campo...' : 'Criando campo...', tone: 'loading' })
    try {
      if (selectedField) await customFieldsApi.update(selectedField, draft)
      else {
        const nextPosition = Math.max(0, ...customFields.map((item) => item.position)) + 10
        await customFieldsApi.create(draft, nextPosition)
      }
      await refresh()
      updateToast(toastId, {
        message: selectedField ? 'Campo atualizado.' : 'Campo criado e disponível nos cadastros.',
        tone: 'success',
      })
      setIsDialogOpen(false)
    } catch (saveError) {
      updateToast(toastId, { message: saveError instanceof Error ? saveError.message : 'Não foi possível salvar o campo.', tone: 'error' })
    } finally { setIsSaving(false) }
  }, [customFields, refresh, selectedField, showToast, updateToast])

  const handleToggleActive = useCallback(async (field: CustomField): Promise<void> => {
    setBusyFieldId(field.id)
    const nextActive = !field.isActive
    const toastId = showToast({ message: nextActive ? 'Reativando campo...' : 'Desativando campo...', tone: 'loading' })
    try {
      await customFieldsApi.setActive(field, nextActive)
      await refresh()
      updateToast(toastId, {
        message: nextActive ? 'Campo reativado nos cadastros.' : 'Campo ocultado. As respostas foram preservadas.',
        tone: 'success',
      })
    } catch (toggleError) {
      updateToast(toastId, { message: toggleError instanceof Error ? toggleError.message : 'Não foi possível alterar o campo.', tone: 'error' })
    } finally { setBusyFieldId(null) }
  }, [refresh, showToast, updateToast])

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!fieldPendingDelete) return
    setIsDeleting(true)
    const toastId = showToast({ message: 'Apagando campo e respostas...', tone: 'loading' })
    try {
      await customFieldsApi.remove(fieldPendingDelete)
      await refresh()
      updateToast(toastId, { message: 'Campo e respostas apagados definitivamente.', tone: 'success' })
      setFieldPendingDelete(null)
    } catch (deleteError) {
      updateToast(toastId, { message: deleteError instanceof Error ? deleteError.message : 'Não foi possível apagar o campo.', tone: 'error' })
    } finally { setIsDeleting(false) }
  }, [fieldPendingDelete, refresh, showToast, updateToast])

  const activeCount = customFields.filter((field) => field.isActive).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>Campos personalizados</h1><p>Defina quais informações adicionais fazem parte do cadastro dos jovens.</p></div>
        {isAdmin && <button type="button" onClick={openCreate} disabled={isLoading}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>Novo campo
        </button>}
      </header>

      {!isLoading && !isAdmin && <section className={styles.statePanel}>
        <strong>Acesso administrativo necessário</strong><p>Somente administradores ativos podem criar ou alterar campos.</p>
      </section>}

      {isAdmin && error && <section className={styles.statePanel} role="alert">
        <strong>Não foi possível carregar os campos.</strong><p>{error}</p>
        <button type="button" onClick={() => void refresh()}>Tentar novamente</button>
      </section>}

      {isAdmin && !error && <section className={styles.workspace} aria-labelledby="fields-title">
        <div className={styles.workspaceHeading}>
          <div><h2 id="fields-title">Informações adicionais</h2><p>{isLoading ? 'Carregando campos...' : `${activeCount} ${activeCount === 1 ? 'campo ativo' : 'campos ativos'}`}</p></div>
          <span>Campos desativados mantêm as respostas já salvas.</span>
        </div>
        <div className={styles.fieldList} aria-live="polite" aria-busy={isLoading}>
          {isLoading && Array.from({ length: 3 }, (_, index) => <div className={styles.skeleton} key={index} aria-hidden="true"><span /><span /></div>)}
          {!isLoading && customFields.length === 0 && <div className={styles.emptyState}>
            <strong>Nenhum campo personalizado</strong><p>Crie o primeiro campo sem alterar o código ou o banco manualmente.</p>
            <button type="button" onClick={openCreate}>Criar primeiro campo</button>
          </div>}
          {!isLoading && customFields.map((field) => <article className={styles.fieldRow} key={field.id} data-inactive={!field.isActive}>
            <div className={styles.fieldIdentity}><strong>{field.label}</strong><span>{customFieldTypeLabels[field.type]}{field.required ? ' · obrigatório' : ' · opcional'}</span>{field.type === 'select' && <small>{field.options.join(', ')}</small>}</div>
            <span className={styles.fieldStatus} data-active={field.isActive}>{field.isActive ? 'Ativo' : 'Desativado'}</span>
            <div className={styles.actions}>
              <button type="button" onClick={() => openEdit(field)}>Editar</button>
              <button type="button" disabled={busyFieldId === field.id} onClick={() => void handleToggleActive(field)}>{field.isActive ? 'Desativar' : 'Reativar'}</button>
              <button className={styles.removeAction} type="button" disabled={busyFieldId === field.id}
                onClick={() => setFieldPendingDelete(field)}>Apagar</button>
            </div>
          </article>)}
        </div>
      </section>}

      <CustomFieldDialog field={selectedField} isOpen={isDialogOpen} isSaving={isSaving}
        onClose={() => { if (!isSaving) setIsDialogOpen(false) }} onSave={handleSave} />
      <DeleteFieldDialog field={fieldPendingDelete} isDeleting={isDeleting}
        onCancel={() => { if (!isDeleting) setFieldPendingDelete(null) }}
        onConfirm={() => void handleDelete()} />
    </div>
  )
}

export default CustomFieldsPage
