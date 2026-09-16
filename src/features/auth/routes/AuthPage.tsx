import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/toast/useToast'
import { authApi } from '../api/authApi'
import PasswordStrength from '../components/PasswordStrength'
import { useAuth } from '../context/useAuth'
import { getAuthErrorMessage } from '../helpers/authMessages'
import {
  isStrongPassword,
  MIN_PASSWORD_LENGTH,
} from '../helpers/passwordStrength'
import styles from './AuthPage.module.css'

interface AuthPageProps {
  mode: 'login' | 'signup' | 'reset'
}

const EmailIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="4" />
    <path d="m5 8 7 5 7-5" />
  </svg>
)

const LockIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="4" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.6" />
    {!visible && <path d="m4 4 16 16" />}
  </svg>
)

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingAction, setPendingAction] = useState<'form' | 'reset' | null>(null)
  const { session, isCheckingSession } = useAuth()
  const { showToast, updateToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'
  const destination =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('//')
      ? location.state.from
      : '/dashboard'

  useEffect(() => {
    if (!isReset && !isCheckingSession && session) {
      navigate(destination, { replace: true })
    }
  }, [destination, isCheckingSession, isReset, navigate, session])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault()
      if (pendingAction) return

      const formData = new FormData(event.currentTarget)
      const password = String(formData.get('password') ?? '')
      const name = String(formData.get('name') ?? '').trim()

      if (isSignup && name.length < 2) {
        showToast({ message: 'Digite seu nome completo.', tone: 'warning' })
        return
      }

      if (!isReset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        showToast({ message: 'Digite um endereço de e-mail válido.', tone: 'warning' })
        return
      }

      if (!password) {
        showToast({ message: 'Digite sua senha.', tone: 'warning' })
        return
      }

      if ((isSignup || isReset) && !isStrongPassword(password)) {
        showToast({
          message: 'Sua senha ainda não atende a todos os requisitos.',
          tone: 'warning',
        })
        return
      }

      const toastId = showToast({
        message: isReset
          ? 'Salvando sua nova senha...'
          : isSignup
            ? 'Criando sua conta...'
            : 'Entrando...',
        tone: 'loading',
      })

      setPendingAction('form')

      try {
        const result = isReset
          ? await authApi.updatePassword(password)
          : isSignup
            ? await authApi.signUp(name, email.trim(), password)
            : await authApi.signIn(email.trim(), password)

        if (result.error) throw result.error

        if (isSignup && 'session' in result.data && !result.data.session) {
          updateToast(toastId, {
            message: 'Conta criada. Confira seu e-mail para confirmar o acesso.',
            tone: 'success',
            duration: 6500,
          })
          return
        }

        updateToast(toastId, {
          message: isReset
            ? 'Senha atualizada com sucesso.'
            : isSignup
              ? 'Conta criada com sucesso.'
              : 'Bem-vindo de volta.',
          tone: 'success',
        })
        navigate(destination, { replace: true })
      } catch (error) {
        updateToast(toastId, {
          message: getAuthErrorMessage(error),
          tone: 'error',
          duration: 6000,
        })
      } finally {
        setPendingAction(null)
      }
    },
    [
      destination,
      email,
      isReset,
      isSignup,
      navigate,
      pendingAction,
      showToast,
      updateToast,
    ],
  )

  const handlePasswordReset = useCallback(async (): Promise<void> => {
    if (pendingAction) return

    if (!email.trim()) {
      showToast({
        message: 'Digite seu e-mail para receber o link de recuperação.',
        tone: 'warning',
      })
      return
    }

    const toastId = showToast({ message: 'Enviando o link...', tone: 'loading' })
    setPendingAction('reset')

    try {
      const { error } = await authApi.requestPasswordReset(email.trim())
      if (error) throw error

      updateToast(toastId, {
        message: 'Se esse e-mail estiver cadastrado, enviaremos um link de recuperação.',
        tone: 'success',
        duration: 6500,
      })
    } catch (error) {
      updateToast(toastId, {
        message: getAuthErrorMessage(error),
        tone: 'error',
        duration: 6000,
      })
    } finally {
      setPendingAction(null)
    }
  }, [email, pendingAction, showToast, updateToast])

  return (
    <main className={styles.page}>
      <section
        className={styles.authShell}
        data-mode={mode}
        aria-labelledby="auth-title"
      >
        <div
          className={styles.formSide}
          data-mode={mode}
          data-scroll-region="formulário"
        >
          <div className={styles.formWrap}>
            <div className={styles.heading}>
              <h1 id="auth-title">
                {isReset
                  ? 'Crie uma nova senha'
                  : isSignup
                    ? 'Crie sua conta'
                    : 'Bem-vindo de volta'}
              </h1>
              <p>
                {isReset
                  ? 'Escolha uma senha segura para continuar.'
                  : isSignup
                    ? 'Comece a cuidar da nossa comunidade.'
                    : 'Entre para cuidar da nossa comunidade.'}
              </p>
            </div>

            <form
              className={styles.form}
              aria-busy={pendingAction === 'form'}
              noValidate
              onSubmit={handleSubmit}
            >
              {isSignup && (
                <div className={styles.field}>
                  <label htmlFor="auth-name">Nome</label>
                  <div className={styles.inputShell}>
                    <input
                      id="auth-name"
                      name="name"
                      type="text"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              {!isReset && (
                <div className={styles.field}>
                  <label htmlFor="auth-email">E-mail</label>
                  <div className={styles.inputShell}>
                    <EmailIcon />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="auth-password">
                  {isReset ? 'Nova senha' : 'Senha'}
                </label>
                <div className={styles.inputShell}>
                  <LockIcon />
                  <input
                    id="auth-password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder={isReset ? 'Sua nova senha' : 'Sua senha'}
                    autoComplete={isSignup || isReset ? 'new-password' : 'current-password'}
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby={
                      isSignup || isReset ? 'auth-password-hint' : undefined
                    }
                    required
                  />
                  <button
                    className={styles.visibilityButton}
                    type="button"
                    aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((current) => !current)}
                  >
                    <EyeIcon visible={passwordVisible} />
                  </button>
                </div>
                {(isSignup || isReset) && (
                  <div id="auth-password-hint">
                    <PasswordStrength password={password} />
                  </div>
                )}
              </div>

              {!isSignup && (
                <button
                  className={styles.forgotButton}
                  type="button"
                  disabled={pendingAction !== null}
                  onClick={handlePasswordReset}
                >
                  {pendingAction === 'reset' ? 'Enviando...' : 'Esqueci minha senha'}
                </button>
              )}

              <button
                className={styles.primaryButton}
                type="submit"
                disabled={pendingAction !== null}
              >
                {pendingAction === 'form'
                  ? isReset
                    ? 'Salvando senha...'
                    : isSignup
                      ? 'Criando conta...'
                      : 'Entrando...'
                  : isReset
                    ? 'Salvar nova senha'
                    : isSignup
                      ? 'Criar conta'
                      : 'Entrar'}
              </button>
            </form>

            {!isReset && (
              <p className={styles.switchMode}>
                {isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
                <Link to={isSignup ? '/login' : '/cadastro'}>
                  {isSignup ? 'Entrar' : 'Criar conta'}
                </Link>
              </p>
            )}
          </div>
        </div>

        <figure className={styles.photoSide}>
          <img
            src="/images/login-clouds.jpg"
            alt="Nuvens densas iluminadas por uma abertura no céu"
          />
          <figcaption>
            <img
              src="/images/umadeb-logo-transparent.png"
              alt="UMADEB"
            />
          </figcaption>
        </figure>
      </section>
    </main>
  )
}

export default AuthPage
