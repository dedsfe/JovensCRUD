import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import YouthFormDialog from '../components/YouthFormDialog'
import { useYouths } from '../context/useYouths'
import { normalizeText } from '../helpers/youthHelpers'
import { useToast } from '../../../components/toast/useToast'
import type { Youth, YouthStatus } from '../types/youth'
import {
  motionTransition,
  reducedMotionTransition,
} from '../../../lib/motion'
import styles from './YouthDirectoryPage.module.css'

type StatusFilter = 'all' | YouthStatus

const filterLabels: Record<StatusFilter, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
  archived: 'Arquivados',
}

const statusLabels: Record<Youth['status'], string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  archived: 'Arquivado',
}

const YouthDirectoryPage: React.FC = () => {
  const { youths, access, isLoading, error, refresh, setYouthStatus } = useYouths()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editingYouth, setEditingYouth] = useState<Youth | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [statusBusy, setStatusBusy] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  const filteredYouth = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())

    return youths.filter((person) => {
      const matchesStatus =
        status === 'all' ? person.status !== 'archived' : person.status === status
      const searchableName = normalizeText(
        `${person.fullName} ${person.preferredName}`,
      )

      return matchesStatus && searchableName.includes(normalizedQuery)
    })
  }, [query, status, youths])

  const openCreateForm = (): void => {
    setEditingYouth(null)
    setIsFormOpen(true)
  }

  const openEditForm = (youth: Youth): void => {
    setEditingYouth(youth)
    setIsFormOpen(true)
  }

  const toggleArchive = async (youth: Youth): Promise<void> => {
    const archiving = youth.status !== 'archived'
    setStatusBusy(youth.id)
    try {
      await setYouthStatus(youth, archiving ? 'archived' : 'active')
      showToast({
        message: archiving
          ? `${youth.preferredName} foi arquivado.`
          : `${youth.preferredName} voltou pra lista de ativos.`,
        tone: 'success',
      })
    } catch (actionError) {
      showToast({
        message:
          actionError instanceof Error
            ? actionError.message
            : 'Não foi possível concluir a ação.',
        tone: 'error',
      })
    } finally {
      setStatusBusy(null)
    }
  }

  const hasDirectoryAccess = access?.canManage === true
  const showDirectory = hasDirectoryAccess && !isLoading && !error

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Jovens</h1>
          <p>Consulte e cuide de quem faz parte da nossa comunidade.</p>
        </div>
        {hasDirectoryAccess && (
          <button className={styles.addButton} type="button" onClick={openCreateForm}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Adicionar jovem
          </button>
        )}
      </header>

      {isLoading && (
        <section className={styles.statePanel} aria-live="polite">
          <strong>Carregando diretório...</strong>
          <p>Buscando os dados protegidos da comunidade.</p>
        </section>
      )}

      {!isLoading && error && (
        <section className={styles.statePanel} role="alert">
          <strong>Não foi possível abrir o diretório.</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()}>
            Tentar novamente
          </button>
        </section>
      )}

      {!isLoading && !error && !hasDirectoryAccess && (
        <section className={styles.statePanel}>
          <strong>Seu acesso ainda não permite gerenciar jovens.</strong>
          <p>
            Um administrador precisa ativar sua conta como líder ou administrador.
          </p>
        </section>
      )}

      {showDirectory && (
        <>
          <section className={styles.tools} aria-label="Busca e filtros">
            <div className={styles.searchField}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
              <label className={styles.srOnly} htmlFor="youth-search">
                Buscar jovem
              </label>
              <input
                id="youth-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou apelido"
                autoComplete="off"
              />
            </div>

            <div className={styles.filters} aria-label="Filtrar por situação">
              {(Object.keys(filterLabels) as StatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={status === filter ? styles.activeFilter : undefined}
                  aria-pressed={status === filter}
                  onClick={() => setStatus(filter)}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.resultSummary} aria-live="polite">
            <strong>{filteredYouth.length}</strong>{' '}
            {filteredYouth.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
          </div>

          <motion.ul className={styles.people} layout={!reduceMotion}>
            <AnimatePresence initial={false} mode="popLayout">
              {filteredYouth.map((person) => (
                <motion.li
                  key={person.id}
                  layout={!reduceMotion}
                  initial={false}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={
                    reduceMotion
                      ? reducedMotionTransition
                      : {
                          layout: motionTransition.layout,
                          opacity: motionTransition.exit,
                          y: motionTransition.exit,
                        }
                  }
                >
                  <span className={styles.portrait} aria-hidden="true">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" />
                    ) : (
                      person.initials
                    )}
                  </span>
                  <span className={styles.personCopy}>
                    <span className={styles.nameLine}>
                      <strong>{person.preferredName}</strong>
                      <small>
                        {person.age === null ? 'idade não informada' : `${person.age} anos`}
                      </small>
                    </span>
                    <span>{person.fullName}</span>
                    {person.phone ? (
                      <a href={`tel:${person.phone.replace(/\D/g, '')}`}>
                        {person.phone}
                      </a>
                    ) : (
                      <small>Telefone não informado</small>
                    )}
                  </span>
                  <span className={styles.personActions}>
                    <span
                      className={styles.status}
                      data-active={person.status === 'active'}
                    >
                      {statusLabels[person.status]}
                    </span>
                    {person.status === 'archived' ? (
                      <button
                        type="button"
                        aria-label={`Restaurar ${person.preferredName}`}
                        disabled={statusBusy === person.id}
                        onClick={() => void toggleArchive(person)}
                      >
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M4 10a6 6 0 1 1 1.8 4.3" />
                          <path d="M4 15v-4h4" />
                        </svg>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label={`Arquivar ${person.preferredName}`}
                          disabled={statusBusy === person.id}
                          onClick={() => void toggleArchive(person)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M3.5 6.5h13M8 9.5h4M8 12.5h4" />
                            <path d="M4.5 6.5v9h11v-9l-1.2-3H5.7l-1.2 3Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`Editar ${person.preferredName}`}
                          onClick={() => openEditForm(person)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="m4 14.8.7-3.2L13 3.3a1.7 1.7 0 0 1 2.4 0l1.3 1.3a1.7 1.7 0 0 1 0 2.4l-8.3 8.3-3.2.7Z" />
                            <path d="m11.8 4.5 3.7 3.7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          {filteredYouth.length === 0 && (
            <div className={styles.emptyState}>
              <strong>
                {youths.length === 0 ? 'O diretório está vazio.' : 'Ninguém encontrado.'}
              </strong>
              <p>
                {youths.length === 0
                  ? 'Adicione o primeiro jovem para começar.'
                  : 'Revise a busca ou volte a mostrar todos os jovens.'}
              </p>
              <button
                type="button"
                onClick={
                  youths.length === 0
                    ? openCreateForm
                    : () => {
                        setQuery('')
                        setStatus('all')
                      }
                }
              >
                {youths.length === 0 ? 'Adicionar jovem' : 'Limpar busca'}
              </button>
            </div>
          )}
        </>
      )}

      <YouthFormDialog
        isOpen={isFormOpen}
        youth={editingYouth}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  )
}

export default YouthDirectoryPage
