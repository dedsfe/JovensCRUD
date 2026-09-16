import { supabase } from '../../../lib/supabase'
import type { CustomField, CustomFieldDraft, CustomFieldType } from '../types/customField'

interface CustomFieldRow {
  id: string
  label: string
  field_type: CustomFieldType
  required: boolean
  options: unknown
  position: number
  is_active: boolean
  created_at: string
}

const selection = 'id, label, field_type, required, options, position, is_active, created_at'

const getCurrentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Sua sessão expirou. Entre novamente.')
  return data.user.id
}

const mapCustomField = (row: CustomFieldRow): CustomField => ({
  id: row.id,
  label: row.label,
  type: row.field_type,
  required: row.required,
  options: Array.isArray(row.options)
    ? row.options.filter((option): option is string => typeof option === 'string')
    : [],
  position: row.position,
  isActive: row.is_active,
  createdAt: row.created_at,
})

export const customFieldsApi = {
  list: async (): Promise<CustomField[]> => {
    const { data, error } = await supabase.from('youth_custom_fields').select(selection)
      .order('position', { ascending: true }).order('created_at', { ascending: true })
    if (error) throw new Error('Não foi possível carregar os campos personalizados.')
    return ((data ?? []) as CustomFieldRow[]).map(mapCustomField)
  },

  create: async (draft: CustomFieldDraft, position: number): Promise<CustomField> => {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase.from('youth_custom_fields').insert({
      label: draft.label.trim(), field_type: draft.type, required: draft.required,
      options: draft.type === 'select' ? draft.options : [], position,
      created_by: userId, updated_by: userId,
    }).select(selection).single()
    if (error || !data) throw new Error('Não foi possível criar o campo.')
    return mapCustomField(data as CustomFieldRow)
  },

  update: async (field: CustomField, draft: CustomFieldDraft): Promise<CustomField> => {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase.from('youth_custom_fields').update({
      label: draft.label.trim(), field_type: draft.type, required: draft.required,
      options: draft.type === 'select' ? draft.options : [], updated_by: userId,
    }).eq('id', field.id).select(selection).single()
    if (error || !data) throw new Error('Não foi possível salvar o campo.')
    return mapCustomField(data as CustomFieldRow)
  },

  setActive: async (field: CustomField, isActive: boolean): Promise<CustomField> => {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase.from('youth_custom_fields')
      .update({ is_active: isActive, updated_by: userId }).eq('id', field.id)
      .select(selection).single()
    if (error || !data) throw new Error(isActive ? 'Não foi possível reativar o campo.' : 'Não foi possível desativar o campo.')
    return mapCustomField(data as CustomFieldRow)
  },
}
