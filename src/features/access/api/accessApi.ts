import { supabase } from '../../../lib/supabase'
import type {
  AccessProfile,
  AccessRole,
  AccessStatus,
  AccessUpdate,
} from '../types/access'

interface AccessProfileRow {
  id: string
  full_name: string
  email: string | null
  role: AccessRole
  status: AccessStatus
  created_at: string
  updated_at: string
}

const mapAccessProfile = (row: AccessProfileRow): AccessProfile => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email ?? '',
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const getAccessErrorMessage = (message: string | undefined): string => {
  if (message?.includes('pelo menos um administrador ativo')) {
    return 'A UMADEB precisa manter pelo menos um administrador ativo.'
  }
  if (message?.includes('administradores ativos')) {
    return 'Você não possui permissão para gerenciar acessos.'
  }
  if (message?.includes('não foi encontrada')) {
    return 'Essa conta não foi encontrada. Atualize a lista e tente novamente.'
  }
  return 'Não foi possível atualizar o acesso. Tente novamente.'
}

export const accessApi = {
  list: async (): Promise<AccessProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error('Não foi possível carregar as contas.')
    return ((data ?? []) as AccessProfileRow[]).map(mapAccessProfile)
  },

  update: async (
    profileId: string,
    update: AccessUpdate,
  ): Promise<AccessProfile> => {
    const { data, error } = await supabase.rpc('admin_update_profile_access', {
      target_user_id: profileId,
      next_role: update.role,
      next_status: update.status,
    })

    if (error || !data) throw new Error(getAccessErrorMessage(error?.message))
    return mapAccessProfile(data as AccessProfileRow)
  },
}
