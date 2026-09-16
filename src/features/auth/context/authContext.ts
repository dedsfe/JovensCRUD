import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  isCheckingSession: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
