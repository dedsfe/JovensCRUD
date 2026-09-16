import { useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { AuthContext } from './authContext'

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      setIsCheckingSession(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isCheckingSession }),
    [isCheckingSession, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
