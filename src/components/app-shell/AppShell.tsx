import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../toast/useToast'
import { authApi } from '../../features/auth/api/authApi'
import { useAuth } from '../../features/auth/context/useAuth'
import { getAuthErrorMessage } from '../../features/auth/helpers/authMessages'
import { useYouths } from '../../features/youth/context/useYouths'
import SignOutConfirmationDialog from '../../features/account/components/SignOutConfirmationDialog'
import {
  motionTransition,
  reducedMotionTransition,
} from '../../lib/motion'
import styles from './AppShell.module.css'

type NavigationIcon = 'home' | 'people' | 'access'

interface NavigationItem {
  label: string
  path: string
  icon: NavigationIcon
}

const navigation: NavigationItem[] = [
  { label: 'Início', path: '/dashboard', icon: 'home' },
  { label: 'Jovens', path: '/jovens', icon: 'people' },
  { label: 'Acessos', path: '/acessos', icon: 'access' },
]

const NavigationGlyph: React.FC<{ icon: NavigationIcon }> = ({ icon }) => {
  if (icon === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.4 12 4l8 6.4V20H4Z" />
        <path d="M9.2 20v-6.2h5.6V20" />
      </svg>
    )
  }

  if (icon === 'people') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 19c.4-3.3 2.1-5 5.2-5s4.8 1.7 5.2 5" />
        <path d="M15.5 6.2a3 3 0 0 1 0 5.6M16.8 14.4c2 .5 3.1 2 3.4 4.6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3.5 18.5c.4-3 2-4.6 5-4.6 1.3 0 2.3.3 3.1.8" />
      <path d="M16.8 11.5v8M12.8 15.5h8" />
    </svg>
  )
}

interface NavigationLinksProps {
  scope: 'desktop' | 'mobile'
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ scope }) => {
  const reduceMotion = useReducedMotion()
  const { access } = useYouths()
  const visibleNavigation = access?.role === 'admin'
    ? navigation
    : navigation.filter((item) => item.path !== '/acessos')

  return visibleNavigation.map((item) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        isActive ? styles.activeLink : styles.navLink
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              className={styles.activeBackground}
              layoutId={`${scope}-active-navigation`}
              transition={
                reduceMotion
                  ? reducedMotionTransition
                  : motionTransition.navigation
              }
              aria-hidden="true"
            />
          )}
          <NavigationGlyph icon={item.icon} />
          <span className={styles.navLabel}>{item.label}</span>
        </>
      )}
    </NavLink>
  ))
}

const AppShell: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  const { user } = useAuth()
  const { showToast, updateToast } = useToast()

  const account = useMemo(() => {
    const fullName = String(user?.user_metadata.full_name ?? '').trim()
    const name = fullName || user?.email?.split('@')[0] || 'Usuário'
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    return { name, initials, email: user?.email ?? '' }
  }, [user])

  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleConfirmSignOut = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true)
    const toastId = showToast({ message: 'Saindo da sua conta...', tone: 'loading' })
    const { error } = await authApi.signOut()

    if (error) {
      setIsLoggingOut(false)
      setIsLogoutOpen(false)
      updateToast(toastId, { message: getAuthErrorMessage(error), tone: 'error' })
      return
    }

    updateToast(toastId, { message: 'Você saiu da sua conta.', tone: 'success' })
    navigate('/login', { replace: true })
  }, [navigate, showToast, updateToast])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <NavLink className={styles.brand} to="/dashboard" aria-label="UMADEB, início">
          <img src="/images/umadeb-logo-transparent.png" alt="" />
          <span>UMADEB</span>
        </NavLink>

        <nav className={styles.navigation}>
          <NavigationLinks scope="desktop" />
        </nav>

        <div className={styles.account}>
          <NavLink
            to="/conta"
            className={({ isActive }) =>
              isActive ? styles.accountLinkActive : styles.accountLink
            }
            aria-label="Ir para Minha Conta"
            title="Minha Conta"
          >
            <span className={styles.avatar} aria-hidden="true">{account.initials}</span>
            <span className={styles.accountCopy}>
              <strong>{account.name}</strong>
              <small>{account.email}</small>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => setIsLogoutOpen(true)}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
            </svg>
          </button>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <NavLink className={styles.mobileBrand} to="/dashboard" aria-label="UMADEB, início">
          <img src="/images/umadeb-logo-transparent.png" alt="" />
          <span>UMADEB</span>
        </NavLink>
        <NavLink
          to="/conta"
          className={styles.mobileAccountButton}
          aria-label="Minha conta"
          title="Minha conta"
        >
          <span aria-hidden="true">{account.initials}</span>
        </NavLink>
      </header>

      <main
        ref={contentRef}
        className={styles.content}
        data-scroll-region="conteúdo principal"
      >
        <Outlet />
      </main>

      <nav className={styles.bottomNavigation} aria-label="Navegação principal">
        <NavigationLinks scope="mobile" />
      </nav>

      <SignOutConfirmationDialog
        isOpen={isLogoutOpen}
        isSigningOut={isLoggingOut}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  )
}

export default AppShell
