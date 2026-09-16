import { supabase } from '../../../lib/supabase'
import type { AccountProfile, AccountRole, AccountStatus } from '../types/account'

interface ProfileRow {
  id: string
  full_name: string
  email: string | null
  role: AccountRole
  status: AccountStatus
  created_at: string
}

const mapAccountProfile = (row: ProfileRow): AccountProfile => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email ?? '',
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
})

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('password should be at least')) {
      return 'A nova senha deve ter pelo menos 8 caracteres.'
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.'
    }
    if (msg.includes('session') || msg.includes('jwt')) {
      return 'Sua sessão expirou. Entre novamente para continuar.'
    }
  }
  return defaultMessage
}

export const accountApi = {
  getProfile: async (userId: string): Promise<AccountProfile> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) {
      throw new Error('Não foi possível carregar as informações da sua conta.')
    }

    return mapAccountProfile(data as ProfileRow)
  },

  updateName: async (userId: string, fullName: string): Promise<void> => {
    const trimmed = fullName.trim()
    if (trimmed.length < 2 || trimmed.length > 120) {
      throw new Error('O nome deve conter entre 2 e 120 caracteres.')
    }

    // 1. Atualiza metadados na sessão de auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    })

    if (authError) {
      throw new Error(getErrorMessage(authError, 'Não foi possível atualizar o perfil.'))
    }

    // 2. Atualiza tabela pública profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', userId)

    if (profileError) {
      throw new Error(getErrorMessage(profileError, 'Não foi possível salvar o nome no perfil.'))
    }
  },

  updatePassword: async (password: string): Promise<void> => {
    if (password.length < 8) {
      throw new Error('A nova senha deve conter no mínimo 8 caracteres.')
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      throw new Error(getErrorMessage(error, 'Não foi possível atualizar a senha.'))
    }
  },
}
