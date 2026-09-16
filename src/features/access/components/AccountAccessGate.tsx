import { useCallback } from 'react'
import type { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/toast/useToast'
import { authApi } from '../../auth/api/authApi'
import { getAuthErrorMessage } from '../../auth/helpers/authMessages'
import { useYouths } from '../../youth/context/useYouths'
import styles from './AccountAccessGate.module.css'

const AccountAccessGate: React.FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate()
  const { access, isLoading, error, refresh } = useYouths()
  const { showToast, updateToast } = useToast()

  const handleSignOut = useCallback(async (): Promise<void> => {
    const toastId = showToast({ message: 'Saindo da sua conta...', tone: 'loading' })
    const { error: signOutError } = await authApi.signOut()

    if (signOutError) {
      updateToast(toastId, { message: getAuthErrorMessage(signOutError), tone: 'error' })
      return
    }

    updateToast(toastId, { message: 'Você saiu da sua conta.', tone: 'success' })
    navigate('/login', { replace: true })
  }, [navigate, showToast, updateToast])

  const isActive = access?.status === 'active'
  const isPending = access?.status === 'pending'
  const isBlocked = access?.status === 'blocked'

  return (
    <>
      {isActive && children}

      {!isActive && (
        <main className={styles.page}>
          <section className={styles.content} aria-live="polite">
            <img src="/images/umadeb-logo-transparent.png" alt="UMADEB" />

            {isLoading && (
              <>
                <h1>Verificando seu acesso</h1>
                <p>Estamos conferindo a situação da sua conta.</p>
              </>
            )}

            {!isLoading && isPending && (
              <>
                <h1>Cadastro recebido</h1>
                <p>
                  Sua conta está aguardando aprovação de um administrador da UMADEB.
                </p>
              </>
            )}

            {!isLoading && isBlocked && (
              <>
                <h1>Acesso bloqueado</h1>
                <p>
                  Um administrador suspendeu este acesso. Fale com a liderança para
                  solicitar uma revisão.
                </p>
              </>
            )}

            {!isLoading && !access && (
              <>
                <h1>Não foi possível verificar sua conta</h1>
                <p>{error ?? 'Tente novamente em alguns instantes.'}</p>
                <button className={styles.primaryAction} type="button" onClick={() => void refresh()}>
                  Tentar novamente
                </button>
              </>
            )}

            {!isLoading && (isPending || isBlocked) && (
              <button className={styles.signOutAction} type="button" onClick={handleSignOut}>
                Sair desta conta
              </button>
            )}
          </section>
        </main>
      )}
    </>
  )
}

export default AccountAccessGate
