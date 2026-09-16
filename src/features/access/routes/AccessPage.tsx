import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../../components/toast/useToast'
import { useAuth } from '../../auth/context/useAuth'
import { useYouths } from '../../youth/context/useYouths'
import { accessApi } from '../api/accessApi'
import AccessEditorDialog from '../components/AccessEditorDialog'
import {
  accessRoleLabels,
  accessStatusLabels,
  formatAccessDate,
  getAccessInitials,
  normalizeAccessSearch,
} from '../helpers/accessHelpers'
import type {
  AccessFilter,
  AccessProfile,
  AccessStatus,
  AccessUpdate,
} from '../types/access'
import styles from './AccessPage.module.css'

const filters: Array<{ value: AccessFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'active', label: 'Ativos' },
  { value: 'blocked', label: 'Bloqueados' },
]

const AccessPage: React.FC = () => {
  const { user } = useAuth()
  const { access, isLoading: isAccessLoading, error: accessError } = useYouths()
  const { showToast, updateToast } = useToast()
  const [profiles, setProfiles] = useState<AccessProfile[]>([])
  const [filter, setFilter] = useState<AccessFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isAdmin = access?.role === 'admin' && access.status === 'active'

  const loadProfiles = useCallback(async (): Promise<void> => {
    if (!isAdmin) return
    setIsLoading(true)
    setLoadError(null)

    try {
      setProfiles(await accessApi.list())
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Não foi possível carregar as contas.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAccessLoading) return
    if (!isAdmin) return

    const loadFrame = window.requestAnimationFrame(() => void loadProfiles())
    return () => window.cancelAnimationFrame(loadFrame)
  }, [isAccessLoading, isAdmin, loadProfiles])

  const counts = useMemo(
    () =>
      profiles.reduce<Record<AccessStatus, number>>(
        (current, profile) => {
          current[profile.status] += 1
          return current
        },
        { pending: 0, active: 0, blocked: 0 },
      ),
    [profiles],
  )

  const visibleProfiles = useMemo(() => {
    const query = normalizeAccessSearch(search.trim())
    return profiles.filter((profile) => {
      const matchesFilter = filter === 'all' || profile.status === filter
      const matchesSearch =
        !query ||
        normalizeAccessSearch(`${profile.fullName} ${profile.email}`).includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, profiles, search])

  const handleSave = useCallback(
    async (update: AccessUpdate): Promise<void> => {
      if (!selectedProfile) return
      setIsSaving(true)
      const isBlocking = update.status === 'blocked'
      const isApproving = selectedProfile.status === 'pending' && update.status === 'active'
      const toastId = showToast({
        message: isBlocking
          ? 'Bloqueando acesso...'
          : isApproving
            ? 'Aprovando acesso...'
            : 'Salvando acesso...',
        tone: 'loading',
      })

      try {
        const updated = await accessApi.update(selectedProfile.id, update)
        setProfiles((current) =>
          current.map((profile) => (profile.id === updated.id ? updated : profile)),
        )
        updateToast(toastId, {
          message: isBlocking
            ? 'Acesso bloqueado.'
            : isApproving
              ? 'Conta aprovada com sucesso.'
              : selectedProfile.status === 'blocked'
                ? 'Acesso reativado.'
                : 'Permissões atualizadas.',
          tone: 'success',
        })
        setSelectedProfile(null)
      } catch (error) {
        updateToast(toastId, {
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o acesso.',
          tone: 'error',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [selectedProfile, showToast, updateToast],
  )

  const showContent = isAdmin && !isLoading && !loadError
  const showPermissionState = !isAccessLoading && !isAdmin
  const statusMessage = accessError ?? 'Somente administradores ativos podem acessar esta área.'

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Acessos</h1>
          <p>Aprove contas e defina quem pode cuidar da comunidade.</p>
        </div>
        {isAdmin && (
          <button type="button" disabled={isLoading} onClick={() => void loadProfiles()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 8a7.5 7.5 0 1 0 .2 7.7M19 4v4h-4" />
            </svg>
            Atualizar
          </button>
        )}
      </header>

      {showPermissionState && (
        <section className={styles.statePanel} aria-live="polite">
          <strong>Acesso administrativo necessário</strong>
          <p>{statusMessage}</p>
        </section>
      )}

      {isAdmin && (
        <>
          <section className={styles.overview} aria-label="Resumo dos acessos">
            <div>
              <strong>{isLoading ? '–' : counts.pending}</strong>
              <span>Aguardando aprovação</span>
            </div>
            <div>
              <strong>{isLoading ? '–' : counts.active}</strong>
              <span>Contas ativas</span>
            </div>
            <div>
              <strong>{isLoading ? '–' : counts.blocked}</strong>
              <span>Contas bloqueadas</span>
            </div>
          </section>

          <section className={styles.directory} aria-labelledby="accounts-title">
            <div className={styles.directoryHeading}>
              <div>
                <h2 id="accounts-title">Contas</h2>
                <p>{isLoading ? 'Carregando contas...' : `${profiles.length} contas cadastradas`}</p>
              </div>
              <div className={styles.tools}>
                <label className={styles.searchField}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.7" cy="10.7" r="6.7" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <span className={styles.srOnly}>Buscar contas</span>
                  <input
                    type="search"
                    value={search}
                    placeholder="Buscar por nome ou e-mail"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <div className={styles.filters} aria-label="Filtrar contas">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={filter === item.value ? styles.activeFilter : undefined}
                      aria-pressed={filter === item.value}
                      onClick={() => setFilter(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.accountList} aria-live="polite" aria-busy={isLoading}>
              {(isLoading || isAccessLoading) &&
                Array.from({ length: 4 }, (_, index) => (
                  <div className={styles.skeletonRow} key={index} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                ))}

              {loadError && !isLoading && (
                <div className={styles.listState}>
                  <strong>Não foi possível carregar as contas.</strong>
                  <p>{loadError}</p>
                  <button type="button" onClick={() => void loadProfiles()}>
                    Tentar novamente
                  </button>
                </div>
              )}

              {showContent && visibleProfiles.length === 0 && (
                <div className={styles.listState}>
                  <strong>Nenhuma conta encontrada</strong>
                  <p>Ajuste a busca ou escolha outro filtro.</p>
                </div>
              )}

              {showContent &&
                visibleProfiles.map((profile) => {
                  const isCurrentAccount = profile.id === user?.id
                  return (
                    <article className={styles.accountRow} key={profile.id}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getAccessInitials(profile.fullName)}
                      </span>
                      <div className={styles.identity}>
                        <strong>
                          {profile.fullName}
                          {isCurrentAccount && <small>Você</small>}
                        </strong>
                        <span>{profile.email || 'E-mail não disponível'}</span>
                      </div>
                      <div className={styles.accessMeta}>
                        <strong data-status={profile.status}>
                          {accessStatusLabels[profile.status]}
                        </strong>
                        <span>{accessRoleLabels[profile.role]}</span>
                      </div>
                      <div className={styles.createdAt}>
                        <span>Conta criada</span>
                        <strong>{formatAccessDate(profile.createdAt)}</strong>
                      </div>
                      <button
                        className={styles.manageButton}
                        type="button"
                        disabled={isCurrentAccount}
                        aria-label={
                          isCurrentAccount
                            ? 'Esta é a sua conta'
                            : `Gerenciar acesso de ${profile.fullName}`
                        }
                        onClick={() => setSelectedProfile(profile)}
                      >
                        {isCurrentAccount ? 'Sua conta' : 'Gerenciar'}
                      </button>
                    </article>
                  )
                })}
            </div>
          </section>
        </>
      )}

      <AccessEditorDialog
        profile={selectedProfile}
        isSaving={isSaving}
        onClose={() => {
          if (!isSaving) setSelectedProfile(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}

export default AccessPage
