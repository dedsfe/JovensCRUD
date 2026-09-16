import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/toast/useToast'
import { authApi } from '../../auth/api/authApi'
import { useAuth } from '../../auth/context/useAuth'
import PasswordStrength from '../../auth/components/PasswordStrength'
import { accountApi } from '../api/accountApi'
import SignOutConfirmationDialog from '../components/SignOutConfirmationDialog'
import type { AccountProfile, AccountRole } from '../types/account'
import styles from './AccountPage.module.css'

const roleLabels: Record<AccountRole, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
}

const roleDescriptions: Record<AccountRole, string> = {
  admin: 'Acesso total ao diretório, aprovação e gestão de contas.',
  leader: 'Permissão para cadastrar, editar e gerenciar jovens.',
  member: 'Acesso de visualização ao diretório.',
}

const AccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast, updateToast } = useToast()

  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Edit Name State
  const [fullNameInput, setFullNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Change Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Logout Dialog State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadProfile = useCallback(async (): Promise<void> => {
    if (!user) return
    setIsLoadingProfile(true)
    try {
      const data = await accountApi.getProfile(user.id)
      setProfile(data)
      setFullNameInput(data.fullName)
    } catch {
      // Fallback para metadados da sessão se banco demorar
      const metaName = String(user.user_metadata.full_name ?? '').trim()
      setFullNameInput(metaName || user.email?.split('@')[0] || '')
    } finally {
      setIsLoadingProfile(false)
    }
  }, [user])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadProfile()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [loadProfile])

  const accountInitials = useMemo(() => {
    const name = fullNameInput.trim() || profile?.fullName || user?.email?.split('@')[0] || 'U'
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [fullNameInput, profile?.fullName, user?.email])

  const formattedJoinDate = useMemo(() => {
    if (!profile?.createdAt) return ''
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
        new Date(profile.createdAt),
      )
    } catch {
      return ''
    }
  }, [profile])

  // Handle Save Name
  const handleSaveName = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) return

    const trimmed = fullNameInput.trim()
    if (trimmed.length < 2) {
      setNameError('O nome deve ter no mínimo 2 caracteres.')
      return
    }
    if (trimmed.length > 120) {
      setNameError('O nome não pode exceder 120 caracteres.')
      return
    }

    setNameError(null)
    setIsSavingName(true)
    const toastId = showToast({
      message: 'Salvando alterações no perfil...',
      tone: 'loading',
    })

    try {
      await accountApi.updateName(user.id, trimmed)
      if (profile) {
        setProfile({ ...profile, fullName: trimmed })
      }
      updateToast(toastId, {
        message: 'Nome atualizado com sucesso.',
        tone: 'success',
      })
    } catch (err) {
      updateToast(toastId, {
        message: err instanceof Error ? err.message : 'Não foi possível salvar o nome.',
        tone: 'error',
      })
    } finally {
      setIsSavingName(false)
    }
  }

  // Handle Update Password
  const handleUpdatePassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas digitadas não coincidem.')
      return
    }

    setIsSavingPassword(true)
    const toastId = showToast({
      message: 'Atualizando sua senha...',
      tone: 'loading',
    })

    try {
      await accountApi.updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      updateToast(toastId, {
        message: 'Senha atualizada com sucesso.',
        tone: 'success',
      })
    } catch (err) {
      updateToast(toastId, {
        message: err instanceof Error ? err.message : 'Não foi possível atualizar a senha.',
        tone: 'error',
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Handle Sign Out
  const handleConfirmSignOut = async (): Promise<void> => {
    setIsLoggingOut(true)
    const toastId = showToast({
      message: 'Saindo da sua conta...',
      tone: 'loading',
    })

    const { error } = await authApi.signOut()
    if (error) {
      setIsLoggingOut(false)
      setIsLogoutModalOpen(false)
      updateToast(toastId, {
        message: 'Não foi possível sair. Tente novamente.',
        tone: 'error',
      })
      return
    }

    updateToast(toastId, {
      message: 'Você saiu da sua conta.',
      tone: 'success',
    })
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Minha conta</h1>
          <p>Gerencie seus dados pessoais, senha e informações de acesso.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Visão geral do usuário */}
        <section className={styles.card} aria-labelledby="overview-title">
          <div className={styles.profileHero}>
            <span className={styles.largeAvatar} aria-hidden="true">
              {accountInitials}
            </span>
            <div className={styles.profileHeroDetails}>
              <strong>{profile?.fullName || fullNameInput || 'Usuário'}</strong>
              <span>{profile?.email || user?.email}</span>
              <div className={styles.badges}>
                {profile?.role && (
                  <span className={styles.roleBadge}>
                    {roleLabels[profile.role] || profile.role}
                  </span>
                )}
                <span className={styles.statusBadge}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  Conta ativa
                </span>
              </div>
            </div>
          </div>

          <dl className={styles.infoList}>
            <div className={styles.infoItem}>
              <dt>Nível de acesso</dt>
              <dd>
                {profile?.role ? roleLabels[profile.role] : 'Carregando...'}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Permissão</dt>
              <dd>
                {profile?.role ? roleDescriptions[profile.role] : 'Carregando...'}
              </dd>
            </div>
            {formattedJoinDate && (
              <div className={styles.infoItem}>
                <dt>Cadastrado em</dt>
                <dd>{formattedJoinDate}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Informações pessoais */}
        <section className={styles.card} aria-labelledby="personal-title">
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div className={styles.cardHeading}>
              <h2 id="personal-title">Dados pessoais</h2>
              <p>Atualize seu nome de exibição visível para a equipe.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSaveName}>
            <div className={styles.fieldGroup}>
              <label htmlFor="account-full-name">Nome completo</label>
              <input
                id="account-full-name"
                className={styles.input}
                type="text"
                autoComplete="name"
                value={fullNameInput}
                onChange={(e) => {
                  setFullNameInput(e.target.value)
                  if (nameError) setNameError(null)
                }}
                disabled={isSavingName || isLoadingProfile}
                required
              />
              {nameError ? (
                <p className={styles.fieldError} role="alert">
                  {nameError}
                </p>
              ) : (
                <p className={styles.fieldHint}>
                  Este nome será exibido nos registros e na navegação.
                </p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="account-email">E-mail da conta</label>
              <input
                id="account-email"
                className={styles.input}
                type="email"
                value={profile?.email || user?.email || ''}
                readOnly
                disabled
              />
              <p className={styles.fieldHint}>
                O e-mail é utilizado para autenticação no sistema.
              </p>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={
                  isSavingName ||
                  isLoadingProfile ||
                  fullNameInput.trim() === (profile?.fullName || '')
                }
              >
                {isSavingName ? 'Salvando...' : 'Salvar nome'}
              </button>
            </div>
          </form>
        </section>

        {/* Segurança e Senha */}
        <section className={styles.card} aria-labelledby="security-title">
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className={styles.cardHeading}>
              <h2 id="security-title">Segurança e senha</h2>
              <p>Defina uma nova senha para proteger seu acesso.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleUpdatePassword}>
            <div className={styles.fieldGroup}>
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                placeholder="Mínimo de 8 caracteres"
                disabled={isSavingPassword}
              />
            </div>

            {newPassword.length > 0 && (
              <PasswordStrength password={newPassword} />
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="confirm-password">Confirmar nova senha</label>
              <input
                id="confirm-password"
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                placeholder="Repita a nova senha"
                disabled={isSavingPassword}
              />
              {passwordError && (
                <p className={styles.fieldError} role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={
                  isSavingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword.length < 8
                }
              >
                {isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </div>
          </form>
        </section>

        {/* Sessão */}
        <section
          className={`${styles.card} ${styles.destructiveCard}`}
          aria-labelledby="session-title"
        >
          <div className={styles.destructiveHeader}>
            <div className={styles.destructiveInfo}>
              <h2 id="session-title">Sessão da conta</h2>
              <p>
                Deseja desconectar deste computador ou celular? Você precisará
                fazer login novamente.
              </p>
            </div>
            <button
              type="button"
              className={styles.signOutButton}
              onClick={() => setIsLogoutModalOpen(true)}
            >
              Sair da conta
            </button>
          </div>
        </section>
      </div>

      <SignOutConfirmationDialog
        isOpen={isLogoutModalOpen}
        isSigningOut={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  )
}

export default AccountPage
